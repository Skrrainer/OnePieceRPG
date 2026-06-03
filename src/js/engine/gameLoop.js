// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/gameLoop.js
//  Orchestrates the "Set Sail" action using waypoint-based map navigation.
// ═══════════════════════════════════════════════════════════════════════════

import { fetchEvents, claimDevilFruit, savePlayer } from '../supabase/client.js';
import { shouldDropDevilFruit, pickFrom } from './rng.js';
import {
    getState,
    setCurrentIsland,
    incrementDay,
    toSaveObject,
    isDead,
    modifyFood,
    modifyCola,
    resetLogPose
} from './playerState.js';
import { DEVIL_FRUITS, LOCAL_EVENTS, SEAS } from '../config/gameData.js';
import { ISLANDS } from '../../config/islands.js';
import { calculateTravelTime } from './navigation.js';
import { promptMapEvent, showToast } from '../ui/renderEvents.js'; // Ghost renderEvents removed!
import { renderProfile } from '../ui/renderCharacter.js';
import { renderHub } from '../ui/renderHub.js';

import { animateShipToWaypoint, drawVoyageEvents, clearWaypointMarker, clearAllWaypointMarkers, spawnDetourMarker, clearDetourMarker } from '../ui/renderMap.js';

export async function sailDay(destinationId) {
    const state = getState();
    const startIsland = ISLANDS.find(i => i.id === state.currentIsland);
    const destination = ISLANDS.find(i => i.id === destinationId);

    if (!destination || !startIsland) return;

    if (state.logPoseCharge < 3) {
        showToast('Log Pose needs to charge before setting sail!', 'danger');
        return;
    }

    const daysToTravel = calculateTravelTime(destinationId);
    for(let i=0; i<daysToTravel; i++) incrementDay();

    modifyFood(-(daysToTravel * 10));
    modifyCola(-(daysToTravel * 5));
    resetLogPose();

    if (getState().food < 0 || getState().cola < 0) {
        showToast('You ran out of supplies on the journey and lost HP!', 'danger');
    }

    const seaId = typeof state.seaOfOrigin === 'object' ? state.seaOfOrigin?.id : state.seaOfOrigin;
    const seaConfig = SEAS.find(s => s.id === seaId);
    let difficulty = seaConfig?.difficulty ?? 1;

    if (destination.modifiers?.eventDifficulty) {
        difficulty = Math.ceil(difficulty * destination.modifiers.eventDifficulty);
    }

    const eventCount = difficulty >= 3 ? 2 + Math.round(Math.random()) : 1 + Math.round(Math.random());
    let events = [];
    const { data: remoteEvents, error } = await fetchEvents(seaId, difficulty, eventCount);

    if (!error && remoteEvents && remoteEvents.length > 0) {
        events = remoteEvents;
    } else {
        const pool = LOCAL_EVENTS.filter(e => e.difficulty <= difficulty);
        const shuffled = pool.sort(() => Math.random() - 0.5);
        events = shuffled.slice(0, Math.min(eventCount, shuffled.length));
    }

    let fruitDrop = null;
    const updatedState = getState();
    const forcedFruitEvent = events.find(e => e.is_devil_fruit_drop);
    const dropChanceMult = destination.modifiers?.fruitDropChanceMult ?? 1.0;

    if (forcedFruitEvent || shouldDropDevilFruit(false, dropChanceMult)) {
        const availableFruits = DEVIL_FRUITS.filter(f => {
            const isEquipped = updatedState.hasFruit && updatedState.devilFruit?.id === f.id;
            const isInInventory = updatedState.inventory.some(item => item.id === f.id);
            return !isEquipped && !isInInventory;
        });

        fruitDrop = pickFrom(availableFruits);

        if (fruitDrop && !forcedFruitEvent) {
            events.push({
                id: 'random_fruit_drop',
                type: 'loot',
                title: 'Floating Chest',
                description: 'You spot a pristine chest floating in the wreckage. Inside lies a strangely patterned fruit.',
                choices: [{
                    label: 'Secure it in the hold',
                    chance: 50,
                    success: { hp: 0, gold: 0, text: 'You safely stored the mysterious fruit in your inventory.', item: 'devil_fruit' },
                    fail: { hp: 0, gold: 0, text: 'You opened the chest, but it was just a regular, terrible-tasting melon.' }
                }],
                is_devil_fruit_drop: false
            });
        }
    }

    events.forEach((evt, i) => {
        const progress = (i + 1) / (events.length + 1);
        let baseX = startIsland.x + (destination.x - startIsland.x) * progress;
        let baseY = startIsland.y + (destination.y - startIsland.y) * progress;

        baseX += (Math.random() * 2 - 1);
        baseY += (Math.random() * 2 - 1);

        evt.mapX = Math.max(5, Math.min(95, baseX));
        evt.mapY = Math.max(5, Math.min(95, baseY));
    });

    drawVoyageEvents(events);

    for (let i = 0; i < events.length; i++) {
        await animateShipToWaypoint(events[i].mapX, events[i].mapY);

        const outcome = await promptMapEvent(events[i], events[i].is_devil_fruit_drop ? fruitDrop : null, state.day);
        clearWaypointMarker(i);

        if (isDead()) break;

        if (outcome) {
            const title = events[i].title?.toLowerCase() || '';
            const desc = events[i].description?.toLowerCase() || '';
            const text = outcome.text?.toLowerCase() || '';

            const isMapEvent = title.includes('map') || desc.includes('map') || text.includes('map') || text.includes('directions');
            const playerGotLoot = outcome.gold > 0 || outcome.item === 'devil_fruit' || text.includes('treasure');
            const isNotStandardDebris = !title.includes('debris') && !title.includes('barrel') && !title.includes('galleon');

            if (isMapEvent && playerGotLoot && isNotStandardDebris) {
                const currentX = parseFloat(document.getElementById('player-ship-container').style.left);
                const currentY = parseFloat(document.getElementById('player-ship-container').style.top);

                const detourX = Math.max(5, Math.min(95, currentX + (Math.random() > 0.5 ? 20 : -20) + (Math.random() * 10 - 5)));
                const detourY = Math.max(5, Math.min(95, currentY + (Math.random() > 0.5 ? 20 : -20) + (Math.random() * 10 - 5)));

                showToast('Sailing off course to follow the map!', 'gold');

                const detourMarker = spawnDetourMarker(detourX, detourY);
                await animateShipToWaypoint(detourX, detourY);
                clearDetourMarker(detourMarker);
            }
        }
    }

    if (!isDead()) {
        await animateShipToWaypoint(destination.x, destination.y);
        clearAllWaypointMarkers();
    } else {
        clearAllWaypointMarkers();
    }

    setCurrentIsland(destination.id);

    const savePayload = toSaveObject();
    const { error: saveError } = await savePlayer(savePayload);
    if (saveError) {
        showToast('⚠️ Could not save progress to the cloud.', 'danger');
    }

    const finalState = getState();
    renderProfile(finalState);
    renderHub(finalState);

    if (isDead()) {
        showToast('💀 You have fallen. Your legend ends here.', 'danger');
        const sailBtn = document.getElementById('set-sail-btn');
        if (sailBtn) {
            sailBtn.disabled = true;
            sailBtn.textContent = '💀 Voyage Ended';
        }
    }

    return { events, fruitDrop };
}

export async function triggerLocalExploration() {
    const state = getState();
    const currentIsland = ISLANDS.find(i => i.id === state.currentIsland);

    if (state.logPoseCharge >= 3) {
        showToast('The Log Pose is already fully charged!', 'info');
        return;
    }

    const islandEvents = [
        {
            id: 'explore_market',
            type: 'story',
            title: `Wandering ${currentIsland?.name || 'the Island'}`,
            description: 'You explore the local area, looking for supplies and information.',
            choices: [
                { label: 'Barter with Merchants', chance: 70, success: { hp: 0, gold: -10, food: 15, text: 'You negotiated a good deal on local food.' }, fail: { hp: 0, gold: -20, text: 'You were scammed by a shady vendor.' } },
                { label: 'Scavenge the Docks', chance: 60, success: { hp: 0, gold: 0, cola: 10, text: 'You found some abandoned cola barrels.' }, fail: { hp: -5, gold: 0, text: 'You got caught trespassing and took a beating.' } }
            ]
        },
        {
            id: 'explore_combat',
            type: 'combat',
            title: `Trouble on ${currentIsland?.name || 'the Island'}`,
            description: 'You stumble into a dispute between locals and ruffians.',
            choices: [
                { label: 'Intervene', stat: 'attack', difficulty: 6, success: { hp: -5, gold: 50, text: 'You chased them off and earned a reward.' }, fail: { hp: -20, gold: 0, text: 'They overpowered you and escaped.' } },
                { label: 'Sneak Past', chance: 80, success: { hp: 0, gold: 0, text: 'You avoided the conflict safely.' }, fail: { hp: -10, gold: 0, text: 'You tripped and drew their attention!' } }
            ]
        }
    ];

    const randomEvent = pickFrom(islandEvents);
    randomEvent.is_exploration = true;

    showToast('You set out to explore the island...', 'info');
    await promptMapEvent(randomEvent, null, state.day);

    const finalState = getState();
    renderProfile(finalState);
    renderHub(finalState);
}