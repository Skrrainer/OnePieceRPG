// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderIslandNodes.js
//  Logic and DOM manipulation for the four Island Exploration Nodes.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, modifyFood, modifyCola, applyEventOutcome, toSaveObject, chargeLogPose, repairShip } from '../engine/playerState.js';
import { getCrew } from '../engine/crewState.js';
import { startCombat, executePlayerAction, endPlayerTurn } from '../engine/combat.js';
import { showToast } from './renderEvents.js';
import { renderProfile } from './renderCharacter.js';
import { renderHub } from './renderHub.js';
import { savePlayer } from '../supabase/client.js';

// ── Shared Overlay Logic ──────────────────────────────────────────────────
export function openNodeOverlay(nodeId) {
    document.getElementById('node-overlay').hidden = false;
    document.querySelectorAll('.node-view').forEach(v => v.hidden = true);
    document.getElementById(`node-view-${nodeId}`).hidden = false;
}

// Changed to async so we can await the _persistState network call
export async function closeNodeOverlay() {
    document.getElementById('node-overlay').hidden = true;
    await _persistState();
}

async function _persistState() {
    const currentState = getState();

    // Update UI optimistically
    renderProfile(currentState);
    renderHub(currentState);

    // Explicitly await the database write to guarantee execution
    const savePayload = toSaveObject();
    const { error } = await savePlayer(savePayload);

    if (error) {
        console.error('[GLD] Node save error:', error.message);
        showToast('Database Sync Error', 'danger');
    }
}

// ── Node 1: Combat ────────────────────────────────────────────────────────
export function initCombatNode(enemyKey = 'MARINE_GRUNT') {
    openNodeOverlay('combat');
    startCombat(enemyKey, _updateCombatUI, async (playerWon) => {
        if (playerWon) {
            chargeLogPose(1);
            showToast('Victory! The enemy falls. +1 Log Pose Charge', 'success');
            applyEventOutcome({ gold: 50 });
            await closeNodeOverlay();
        } else {
            showToast('You were defeated...', 'danger');
            await closeNodeOverlay();
        }
    });

    document.getElementById('combat-btn-attack').onclick = () => executePlayerAction('attack');
    document.getElementById('combat-btn-defend').onclick = () => executePlayerAction('defend');
    document.getElementById('combat-btn-end').onclick = () => endPlayerTurn();
}

function _updateCombatUI(combatState) {
    const playerStats = getState();

    // Player HUD
    document.getElementById('combat-player-hp').textContent = `${playerStats.hp} / ${playerStats.maxHp}`;
    document.getElementById('combat-player-energy').textContent = combatState.playerEnergy;
    document.getElementById('combat-player-block').textContent = combatState.playerBlock;

    // Enemy HUD
    document.getElementById('combat-enemy-name').textContent = combatState.enemy.name;
    document.getElementById('combat-enemy-icon').textContent = combatState.enemy.icon;
    document.getElementById('combat-enemy-hp').textContent = `${combatState.enemy.hp} / ${combatState.enemy.maxHp}`;
    document.getElementById('combat-enemy-block').textContent = combatState.enemy.block;

    const intent = combatState.enemy.intents[combatState.enemy.currentIntentIndex];
    document.getElementById('combat-enemy-intent').textContent = intent.label;

    const canAct = combatState.playerEnergy > 0;
    document.getElementById('combat-btn-attack').disabled = !canAct;
    document.getElementById('combat-btn-defend').disabled = !canAct;
}

// ── Node 2: Push Your Luck Scavenging ─────────────────────────────────────
let scavengeState = { risk: 0, stash: { food: 0, cola: 0, gold: 0 } };

export function initScavengeNode() {
    scavengeState = { risk: 0, stash: { food: 0, cola: 0, gold: 0 } };
    openNodeOverlay('scavenge');
    _updateScavengeUI();

    document.getElementById('scavenge-btn-loot').onclick = () => {
        const roll = Math.random() * 100;
        if (roll < scavengeState.risk) {
            showToast('You were spotted! Prepare to fight!', 'danger');
            initCombatNode('LOCAL_THUG');
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
        chargeLogPose(1);
        showToast('Successfully secured the stash! +1 Log Pose Charge', 'success');
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

    const base = Math.floor(Math.random() * 3) + 1;
    const seq = [base, base*2, base*4, base*8, base*16, base*32];
    const missingIndex = Math.floor(Math.random() * 4) + 1;
    puzzleAnswer = seq[missingIndex];
    seq[missingIndex] = '?';

    document.getElementById('denden-sequence').textContent = seq.join(', ');
    const inputField = document.getElementById('denden-input');
    inputField.value = '';

    document.getElementById('denden-btn-submit').onclick = async () => {
        const guess = parseInt(inputField.value, 10);
        if (guess === puzzleAnswer) {
            chargeLogPose(1);
            showToast('Interception successful! +1 Log Pose Charge.', 'success');
            await closeNodeOverlay();
        } else {
            showToast('Wrong frequency! The signal traced back to you.', 'danger');
            initCombatNode('MARINE_GRUNT');
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
    rosterList.innerHTML = crew.map((m, index) => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--color-border); padding: 4px 0;">
            <span>${m.name} (❤️ ${m.hp}/${m.max_hp})</span>
            <button class="btn btn--ghost btn--sm" data-index="${index}" ${m.hp >= m.max_hp || state.food < 5 ? 'disabled' : ''}>Feed (5 🥩)</button>
        </div>
    `).join('');

    rosterList.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            if (state.food >= 5) {
                modifyFood(-5);
                showToast(`Fed crew member!`, 'success');
                _updateCampUI();
            }
        };
    });
}

window.GLD_NODES = {
    openCombat: () => initCombatNode(),
    openScavenge: () => initScavengeNode(),
    openDenDen: () => initDenDenNode(),
    openCamp: () => initCampNode(),
    close: () => closeNodeOverlay()
};