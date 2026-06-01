// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/gameLoop.js
//  Orchestrates the "Set Sail" action: fetch events, apply outcomes,
//  check for Devil Fruit drops, persist to Supabase, then render.
// ═══════════════════════════════════════════════════════════════════════════

import { fetchEvents, claimDevilFruit, savePlayer } from '../supabase/client.js';
import { shouldDropDevilFruit, pickFrom } from './rng.js';
import {
  getState,
  setCurrentIsland,
  incrementDay,
  equipDevilFruit,
  toSaveObject,
  isDead,
} from './playerState.js';
import { DEVIL_FRUITS, LOCAL_EVENTS, SEAS } from '../config/gameData.js';
import { ISLANDS } from '../../config/islands.js';
import { calculateTravelTime } from './navigation.js';
import { renderEvents } from '../ui/renderEvents.js';
import { renderProfile } from '../ui/renderCharacter.js';
import { showToast } from '../ui/renderEvents.js';

/**
 * Core "Set Sail" action.
 * 1. Increment the day based on destination distance.
 * 2. Fetch 1-3 random events from Supabase (fallback to LOCAL_EVENTS).
 * 3. Queue the events for interactive resolution in the UI.
 * 4. Roll for Devil Fruit drop and inject as a fake-able event.
 * 5. Update player's current location.
 * 6. Persist state to Supabase.
 * 7. Render everything.
 * @param {string} destinationId - The ID of the island chosen via Log Pose
 * @returns {Promise<{ events: Array, fruitDrop: Object|null }>}
 */
export async function sailDay(destinationId) {
  const state = getState();

  // Find the island config
  const destination = ISLANDS.find(i => i.id === destinationId);
  if (!destination) {
    console.error('[GLD] Invalid destination ID provided to sailDay');
    return;
  }

  // ── 1. Advance day based on actual travel distance ───────────────────────
  const daysToTravel = calculateTravelTime(destinationId);
  for(let i=0; i<daysToTravel; i++) {
    incrementDay();
  }

  // ── 2. Fetch events ──────────────────────────────────────────────────────
  const seaId = typeof state.seaOfOrigin === 'object'
      ? state.seaOfOrigin?.id
      : state.seaOfOrigin;

  const seaConfig = SEAS.find(s => s.id === seaId);
  let difficulty = seaConfig?.difficulty ?? 1;

  if (destination.modifiers?.eventDifficulty) {
    difficulty = Math.ceil(difficulty * destination.modifiers.eventDifficulty);
  }

  // Number of events this sail: 1–2 for low seas, 2–3 for high seas
  const eventCount = difficulty >= 3 ? 2 + Math.round(Math.random()) : 1 + Math.round(Math.random());

  let events = [];
  const { data: remoteEvents, error } = await fetchEvents(seaId, difficulty, eventCount);

  if (!error && remoteEvents && remoteEvents.length > 0) {
    events = remoteEvents;
  } else {
    // Fallback
    const pool = LOCAL_EVENTS.filter(e => e.difficulty <= difficulty);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    events = shuffled.slice(0, Math.min(eventCount, shuffled.length));
  }

  // ── 3. Devil Fruit drop check ────────────────────────────────────────────
  let fruitDrop = null;
  const updatedState = getState();
  const forcedFruitEvent = events.find(e => e.is_devil_fruit_drop);
  const dropChanceMult = destination.modifiers?.fruitDropChanceMult ?? 1.0;

  // By passing 'false' to the first argument, we ensure the RNG rolls for a drop 
  // even if the player already has a Devil Fruit equipped.
  if (forcedFruitEvent || shouldDropDevilFruit(false, dropChanceMult)) {

    // Filter out fruits the player already has equipped OR currently in their inventory
    const availableFruits = DEVIL_FRUITS.filter(f => {
      const isEquipped = updatedState.hasFruit && updatedState.devilFruit?.id === f.id;
      const isInInventory = updatedState.inventory.some(item => item.id === f.id);
      return !isEquipped && !isInInventory;
    });

    fruitDrop = pickFrom(availableFruits);

    // Convert random drops into interactive events so they aren't forced
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
        is_devil_fruit_drop: false // So it doesn't loop
      });
    }
  }

  // ── 4. Update Location ───────────────────────────────────────────────────
  setCurrentIsland(destination.id);

  // ── 5. Persist to Supabase ───────────────────────────────────────────────
  const savePayload = toSaveObject();
  const { error: saveError } = await savePlayer(savePayload);
  if (saveError) {
    showToast('⚠️ Could not save progress to the cloud.', 'danger');
  }

  // ── 6. Render ────────────────────────────────────────────────────────────
  const finalState = getState();

  // Notice we no longer instantly apply outcomes. The UI handles that now!
  renderEvents(events, fruitDrop, finalState.day);
  renderProfile(finalState);

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