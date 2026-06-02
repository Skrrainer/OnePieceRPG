// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderIslandNodes.js
//  Logic and DOM manipulation for the four Island Exploration Nodes.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, modifyFood, modifyCola, applyEventOutcome, toSaveObject, incrementDay, repairShip } from '../engine/playerState.js';
import { getCrew, modifyCrewHp } from '../engine/crewState.js';
import { startCombat, executeAllyAction, endPlayerTurn, selectEnemy } from '../engine/combat.js';
import { showToast } from './renderEvents.js';
import { renderProfile, renderCrew, updateHubDay } from './renderCharacter.js';
import { renderHub } from './renderHub.js';
import { savePlayer, saveCrewHp } from '../supabase/client.js';

// ── Shared Overlay Logic ──────────────────────────────────────────────────
export function openNodeOverlay(nodeId) {
    document.getElementById('node-overlay').hidden = false;
    document.querySelectorAll('.node-view').forEach(v => v.hidden = true);
    document.getElementById(`node-view-${nodeId}`).hidden = false;
}

export async function closeNodeOverlay() {
    document.getElementById('node-overlay').hidden = true;
    await _persistState();
}

async function _persistState() {
    const currentState = getState();
    renderProfile(currentState);
    renderHub(currentState);

    const savePayload = toSaveObject();
    const { error: playerErr } = await savePlayer(savePayload);

    if (playerErr && playerErr.message !== 'Supabase not configured') {
        console.error('[GLD] Player save error:', playerErr.message);
        showToast('Database Sync Error (Captain)', 'danger');
    }

    const currentCrew = getCrew();
    for (const member of currentCrew) {
        const { error: crewErr } = await saveCrewHp(currentState.id, member.id, member.hp);
        if (crewErr && crewErr.message !== 'Supabase not configured') {
            console.error(`[GLD] Failed to save HP for crew ${member.name}:`, crewErr.message);
        }
    }
}

// ── Node 1: Squad Combat (Random Encounters) ──────────────────────────────
export function initCombatNode() {
    openNodeOverlay('combat');

    const encounterPool = ['EASY_PATROL', 'THUG_GANG', 'OFFICER_SQUAD'];
    const randomEncounter = encounterPool[Math.floor(Math.random() * encounterPool.length)];

    startCombat(randomEncounter, _updateCombatUI, async (playerWon) => {
        if (playerWon) {
            incrementDay();
            showToast('Victory! Combat took 1 Day of time.', 'success');
            applyEventOutcome({ gold: 80 });
            await closeNodeOverlay();
        } else {
            showToast('Your crew was defeated...', 'danger');
            await closeNodeOverlay();
        }
    });

    document.getElementById('combat-btn-end').onclick = () => endPlayerTurn();
}

// ── Custom Quest Combat Integration ───────────────────────────────────────
export function startQuestCombat(encounterKey, onWinCallback) {
    openNodeOverlay('combat');

    startCombat(encounterKey, _updateCombatUI, async (playerWon) => {
        if (playerWon) {
            if (onWinCallback) await onWinCallback();
            await closeNodeOverlay();
        } else {
            showToast('Quest Failed: Your crew was defeated...', 'danger');
            await closeNodeOverlay();
        }
    });

    document.getElementById('combat-btn-end').onclick = () => endPlayerTurn();
}

function _updateCombatUI(combatState) {
    document.getElementById('combat-fleet-energy').textContent = combatState.fleetEnergy;

    const enemiesContainer = document.getElementById('combat-enemies-container');
    enemiesContainer.innerHTML = combatState.enemies.map(enemy => {
        const intent = enemy.intents[enemy.currentIntentIndex];
        const targetAlly = combatState.allies.find(a => a.uid === enemy.targetUid);
        const targetName = targetAlly ? targetAlly.name : 'Unknown';
        const isSelected = combatState.selectedEnemyUid === enemy.uid;

        return `
        <div style="flex: 1; min-width: 150px; background: ${isSelected ? 'var(--color-danger-dark)' : 'var(--color-bg-deep)'}; padding: 1rem; border-radius: var(--radius-md); text-align: center; border: 2px solid ${isSelected ? 'var(--color-danger)' : 'var(--color-border)'}; cursor: pointer;" onclick="window.GLD_NODES.selectEnemy('${enemy.uid}')">
            <div style="font-size: 2rem;">${enemy.icon}</div>
            <h4 style="color: var(--color-danger-light); margin: 0.5rem 0; font-size: 0.9rem;">${enemy.name}</h4>
            <div style="font-size: 0.8rem;">❤️ ${enemy.hp} / ${enemy.maxHp}</div>
            <div style="font-size: 0.8rem;">🛡️ AC: ${(enemy.ac || 10) + (enemy.block || 0)}</div>
            <div style="margin-top: 0.5rem; font-size: 0.7rem; font-style: italic; color: var(--color-gold);">
                ${intent.label}<br/>(Target: ${targetName})
            </div>
        </div>`;
    }).join('');

    const alliesContainer = document.getElementById('combat-allies-container');
    const canAct = combatState.fleetEnergy > 0;

    alliesContainer.innerHTML = combatState.allies.map(ally => {
        const isDead = ally.hp <= 0;
        return `
        <div style="flex: 1; min-width: 140px; background: var(--color-bg-deep); padding: 1rem; border-radius: var(--radius-md); text-align: center; opacity: ${isDead ? '0.5' : '1'};">
            <div style="font-size: 2rem;">${ally.icon}</div>
            <h4 style="color: var(--color-ocean-light); margin: 0.5rem 0; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ally.name}</h4>
            <div style="font-size: 0.8rem;">❤️ ${ally.hp} / ${ally.maxHp}</div>
            <div style="font-size: 0.8rem;">🛡️ AC: ${ally.ac + ally.block}</div>
            <div style="display: flex; gap: 0.2rem; margin-top: 0.5rem;">
                <button class="btn btn--danger btn--sm" style="flex:1; padding: 2px;" onclick="window.GLD_NODES.allyAction('${ally.uid}', 'attack')" ${!canAct || isDead ? 'disabled' : ''}>⚔️</button>
                <button class="btn btn--primary btn--sm" style="flex:1; padding: 2px;" onclick="window.GLD_NODES.allyAction('${ally.uid}', 'defend')" ${!canAct || isDead ? 'disabled' : ''}>🛡️</button>
            </div>
        </div>`;
    }).join('');
}

// ── Node 2: Push Your Luck Scavenging ─────────────────────────────────────
let scavengeState = { risk: 15, stash: { food: 0, cola: 0, gold: 0 } };

export function initScavengeNode() {
    scavengeState = { risk: 15, stash: { food: 0, cola: 0, gold: 0 } };
    openNodeOverlay('scavenge');
    _updateScavengeUI();

    document.getElementById('scavenge-btn-loot').onclick = () => {
        const roll = Math.random() * 100;
        if (roll < scavengeState.risk) {
            showToast('You were spotted! Prepare to fight!', 'danger');
            initCombatNode();
            return;
        }
        scavengeState.stash.food += Math.floor(Math.random() * 10) + 5;
        scavengeState.stash.cola += Math.floor(Math.random() * 5) + 2;
        scavengeState.stash.gold += Math.floor(Math.random() * 20) + 10;
        scavengeState.risk += 15;
        _updateScavengeUI();
    };

    document.getElementById('scavenge-btn-flee').onclick = async () => {
        modifyFood(scavengeState.stash.food);
        modifyCola(scavengeState.stash.cola);
        applyEventOutcome({ gold: scavengeState.stash.gold });
        incrementDay();
        showToast('Successfully secured the stash! Took 1 Day.', 'success');
        await closeNodeOverlay();
    };
}

function _updateScavengeUI() {
    document.getElementById('scavenge-risk-display').textContent = `${scavengeState.risk}%`;
    document.getElementById('scavenge-stash-food').textContent = scavengeState.stash.food;
    document.getElementById('scavenge-stash-cola').textContent = scavengeState.stash.cola;
    document.getElementById('scavenge-stash-gold').textContent = scavengeState.stash.gold;
}

// ── Node 3: Den Den Mushi Interception ────────────────────────────────────
let puzzleAnswer = 0;

export function initDenDenNode() {
    openNodeOverlay('denden');

    const generators = [
        () => {
            const start = Math.floor(Math.random() * 20);
            const step = Math.floor(Math.random() * 10) + 2;
            return Array.from({length: 6}, (_, i) => start + i * step);
        },
        () => {
            const start = Math.floor(Math.random() * 3) + 2;
            const mult = Math.floor(Math.random() * 2) + 2;
            return Array.from({length: 6}, (_, i) => start * Math.pow(mult, i));
        }
    ];

    const seq = generators[Math.floor(Math.random() * generators.length)]();
    const missingIndex = Math.floor(Math.random() * 4) + 1;
    puzzleAnswer = seq[missingIndex];
    seq[missingIndex] = '?';

    document.getElementById('denden-sequence').textContent = seq.join(', ');
    const inputField = document.getElementById('denden-input');
    inputField.value = '';

    document.getElementById('denden-btn-submit').onclick = async () => {
        const guess = parseInt(inputField.value, 10);
        if (guess === puzzleAnswer) {
            incrementDay();
            applyEventOutcome({ gold: 150 });
            showToast('Interception successful! Found a stash worth 150g. Took 1 Day.', 'success');
            await closeNodeOverlay();
        } else {
            showToast('Wrong frequency! The signal traced back to you.', 'danger');
            initCombatNode();
        }
    };
}

// ── Node 4: Crew Camp & Maintenance ───────────────────────────────────────
export function initCampNode() {
    openNodeOverlay('camp');
    _updateCampUI();

    document.getElementById('camp-btn-repair').onclick = () => {
        const state = getState();
        if (state.cola >= 10 && state.shipHp < state.shipHpMax) {
            modifyCola(-10);
            repairShip(20);
            showToast('Ship repaired!', 'success');
            _updateCampUI();
        } else if (state.shipHp >= state.shipHpMax) {
            showToast('Hull is already pristine.', 'info');
        } else {
            showToast('Not enough cola for repairs.', 'danger');
        }
    };
}

function _updateCampUI() {
    const state = getState();
    const crew = getCrew();

    document.getElementById('camp-food-count').textContent = state.food;
    document.getElementById('camp-cola-count').textContent = state.cola;

    const rosterList = document.getElementById('camp-crew-list');
    rosterList.innerHTML = crew.map((m) => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--color-border); padding: 4px 0;">
            <span>${m.name} (❤️ ${m.hp}/${m.max_hp})</span>
            <button class="btn btn--ghost btn--sm camp-feed-btn" data-crew-id="${m.id}" ${m.hp >= m.max_hp || state.food < 5 ? 'disabled' : ''}>Feed (5 🥩)</button>
        </div>
    `).join('');

    rosterList.querySelectorAll('.camp-feed-btn').forEach(btn => {
        btn.onclick = () => {
            const crewId = btn.getAttribute('data-crew-id');
            const currentState = getState();

            if (currentState.food >= 5) {
                modifyFood(-5);
                modifyCrewHp(crewId, 25);
                showToast(`Fed crew member! HP Restored.`, 'success');
                _updateCampUI();
            }
        };
    });
}

window.GLD_NODES = {
    openCombat: () => initCombatNode(),
    startQuestCombat: (encounterKey, onWin) => startQuestCombat(encounterKey, onWin),
    openScavenge: () => initScavengeNode(),
    openDenDen: () => initDenDenNode(),
    openCamp: () => initCampNode(),
    close: () => closeNodeOverlay(),
    selectEnemy: (uid) => selectEnemy(uid),
    allyAction: (uid, action) => executeAllyAction(uid, action)
};