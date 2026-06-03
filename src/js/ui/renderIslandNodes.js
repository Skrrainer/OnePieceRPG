// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderIslandNodes.js
//  Logic and DOM manipulation for the four Island Exploration Nodes.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, modifyFood, modifyCola, applyEventOutcome, toSaveObject, incrementDay, repairShip } from '../engine/playerState.js';
import { getCrew, modifyCrewHp, gainCrewExp } from '../engine/crewState.js';
import { startCombat, executeAllyAction, executeAllySkill, skipTurn, selectEnemy } from '../engine/combat.js';
import { showToast } from './renderEvents.js';
import { renderProfile, renderCrew, updateHubDay } from './renderCharacter.js';
import { renderHub } from './renderHub.js';
import { savePlayer, saveCrewHp } from '../supabase/client.js';
import { CLASSES } from '../config/gameData.js';

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

export function initCombatNode() {
    openNodeOverlay('combat');
    const encounterPool = ['EASY_PATROL', 'THUG_GANG', 'OFFICER_SQUAD'];
    const randomEncounter = encounterPool[Math.floor(Math.random() * encounterPool.length)];

    startCombat(randomEncounter, _updateCombatUI, async (playerWon) => {
        if (playerWon) {
            incrementDay();
            const leveledUp = gainCrewExp(150);
            if (leveledUp) showToast('A crew member Leveled Up!', 'gold', 4000);
            showToast('Victory! Combat took 1 Day of time.', 'success');
            applyEventOutcome({ gold: 80 });
            await closeNodeOverlay();
        } else {
            showToast('Your crew was defeated...', 'danger');
            await closeNodeOverlay();
        }
    });
}

export function startQuestCombat(encounterKey, onWinCallback) {
    openNodeOverlay('combat');
    startCombat(encounterKey, _updateCombatUI, async (playerWon) => {
        if (playerWon) {
            const leveledUp = gainCrewExp(400);
            if (leveledUp) showToast('A crew member Leveled Up!', 'gold', 4000);
            if (onWinCallback) await onWinCallback();
            await closeNodeOverlay();
        } else {
            showToast('Quest Failed: Your crew was defeated...', 'danger');
            await closeNodeOverlay();
        }
    });
}

function _updateCombatUI(combatState) {
    const energyDisplay = document.getElementById('combat-fleet-energy');
    if (energyDisplay) energyDisplay.parentElement.style.display = 'none';

    // ── 1. Initiative Tracker ──
    const headerContainer = document.getElementById('combat-enemies-container').parentElement.parentElement;
    let trackerUI = document.getElementById('initiative-tracker');

    if (!trackerUI) {
        trackerUI = document.createElement('div');
        trackerUI.id = 'initiative-tracker';
        trackerUI.style.display = 'flex';
        trackerUI.style.gap = '8px';
        trackerUI.style.padding = '10px';
        trackerUI.style.marginBottom = '15px';
        trackerUI.style.background = 'rgba(0,0,0,0.3)';
        trackerUI.style.borderRadius = '8px';
        trackerUI.style.overflowX = 'auto';
        headerContainer.insertBefore(trackerUI, headerContainer.children[1]);
    }

    trackerUI.innerHTML = combatState.initiativeQueue.map((uid, index) => {
        const combatant = combatState.allies.find(a => a.uid === uid) || combatState.enemies.find(e => e.uid === uid);
        if (!combatant || combatant.hp <= 0) return '';

        const isTurn = combatState.activeCombatantUid === uid;
        const color = combatant.isPlayer !== undefined ? 'var(--color-ocean-light)' : 'var(--color-danger)';
        const border = isTurn ? `2px solid ${color}` : '1px solid var(--color-border)';
        const opacity = isTurn ? '1' : '0.5';

        return `<div style="padding:4px 8px; border-radius:4px; background:var(--color-bg-deep); border:${border}; opacity:${opacity}; font-size:0.8rem; white-space:nowrap;">
            ${index + 1}. ${combatant.icon} ${combatant.name.substring(0,8)}
        </div>`;
    }).join('');

    // ── 2. Render Enemies ──
    const enemiesContainer = document.getElementById('combat-enemies-container');
    enemiesContainer.innerHTML = combatState.enemies.map(enemy => {
        const intent = enemy.intents[enemy.currentIntentIndex];
        const targetAlly = combatState.allies.find(a => a.uid === enemy.targetUid);
        const targetName = targetAlly ? targetAlly.name : 'Unknown';
        const isSelected = combatState.selectedEnemyUid === enemy.uid;
        const isActive = combatState.activeCombatantUid === enemy.uid;

        return `
        <div style="flex: 1; min-width: 150px; background: ${isSelected ? 'var(--color-danger-dark)' : 'var(--color-bg-deep)'}; padding: 1rem; border-radius: var(--radius-md); text-align: center; border: 2px solid ${isSelected ? 'var(--color-danger)' : (isActive ? 'var(--color-gold)' : 'var(--color-border)')}; cursor: pointer;" onclick="window.GLD_NODES.selectEnemy('${enemy.uid}')">
            ${isActive ? '<div style="color:var(--color-gold); font-size:0.7rem; font-weight:bold; margin-bottom:4px;">▶ ACTIVE TURN</div>' : ''}
            <div style="font-size: 2rem;">${enemy.icon}</div>
            <h4 style="color: var(--color-danger-light); margin: 0.5rem 0; font-size: 0.9rem;">${enemy.name}</h4>
            <div style="font-size: 0.8rem;">❤️ ${enemy.hp} / ${enemy.maxHp}</div>
            <div style="font-size: 0.8rem;">🛡️ AC: ${(enemy.ac || 10) + (enemy.block || 0)}</div>
            <div style="margin-top: 0.5rem; font-size: 0.7rem; font-style: italic; color: var(--color-gold);">
                ${intent.label}<br/>(Target: ${targetName})
            </div>
        </div>`;
    }).join('');

    // ── 3. Render Allies (Visual Cards Only, No Buttons) ──
    const alliesContainer = document.getElementById('combat-allies-container');
    alliesContainer.style.display = 'grid';
    alliesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    alliesContainer.style.gap = '10px';

    alliesContainer.innerHTML = combatState.allies.map(ally => {
        const isDead = ally.hp <= 0;
        const isTurn = combatState.activeCombatantUid === ally.uid;

        return `
        <div style="background: var(--color-bg-deep); padding: 1rem; border-radius: var(--radius-md); text-align: center; border: 2px solid ${isTurn ? 'var(--color-gold)' : 'var(--color-border)'}; opacity: ${isDead ? '0.3' : '1'};">
            ${isTurn && !isDead ? '<div style="color:var(--color-gold); font-size:0.7rem; font-weight:bold; margin-bottom:4px;">▶ ACTIVE</div>' : '<div style="height:12px;"></div>'}
            <div style="font-size: 2rem;">${ally.icon}</div>
            <h4 style="color: var(--color-ocean-light); margin: 0.5rem 0; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ally.name}</h4>
            <div style="font-size: 0.8rem;">❤️ ${ally.hp} / ${ally.maxHp}</div>
            <div style="font-size: 0.8rem;">🛡️ AC: ${ally.ac + ally.block}</div>
            <div style="font-size: 0.7rem; color:var(--color-text-muted); margin-top:2px;">⚔️ ${ally.damageDice} (+${ally.attackBonus})</div>
        </div>`;
    }).join('');

    // ── 4. Central Action Hub ──
    let actionHub = document.getElementById('combat-action-hub');
    if (!actionHub) {
        actionHub = document.createElement('div');
        actionHub.id = 'combat-action-hub';
        alliesContainer.parentElement.appendChild(actionHub);
    }

    const activeUid = combatState.activeCombatantUid;
    const activeAlly = combatState.allies.find(a => a.uid === activeUid);

    if (activeAlly && activeAlly.hp > 0) {
        const roleCfg = CLASSES[activeAlly.roleKey];

        // 1. Build Class Skill Buttons
        const classSkills = (activeAlly.unlockedSkills || []).map(sId => {
            const skill = roleCfg.skillTree.find(s => s.id === sId);
            if (!skill) return '';
            return `<button class="btn btn--primary btn--sm" onclick="window.GLD_NODES.allySkill('${activeAlly.uid}', '${sId}')">✨ ${skill.name}</button>`;
        });

        // 2. Build Devil Fruit Skill Buttons
        const dfSkills = (activeAlly.devilFruit?.skills || []).map(skill => {
            const color = activeAlly.devilFruit.glowColor || 'var(--color-gold)';
            return `<button class="btn btn--danger btn--sm" style="border-color: ${color};" onclick="window.GLD_NODES.allySkill('${activeAlly.uid}', '${skill.id}')">🍇 ${skill.name}</button>`;
        });

        const skillBtns = [...classSkills, ...dfSkills].join('');

        actionHub.innerHTML = `
            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.5); border: 2px solid var(--color-gold); border-radius: 8px; text-align: center;">
                <h4 style="color: var(--color-gold); margin-bottom: 0.8rem;">▶ Command: ${activeAlly.name}</h4>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn--danger" onclick="window.GLD_NODES.allyAction('${activeAlly.uid}', 'attack')">⚔️ Base Attack</button>
                    <button class="btn btn--primary" onclick="window.GLD_NODES.allyAction('${activeAlly.uid}', 'defend')">🛡️ Brace (Guard)</button>
                    ${skillBtns}
                    <button class="btn btn--ghost" onclick="window.GLD_NODES.skipTurn()">⏭️ Skip</button>
                </div>
            </div>
        `;
    } else {
        actionHub.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--color-text-muted); font-style:italic;">Opponent Turn in Progress...</div>`;
    }
}

// ── Other Nodes (Scavenge, Den Den, Camp) Remain Unchanged ──
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

window.GLD_NODES = window.GLD_NODES || {};
Object.assign(window.GLD_NODES, {
    openCombat: () => initCombatNode(),
    startQuestCombat: (encounterKey, onWin) => startQuestCombat(encounterKey, onWin),
    openScavenge: () => initScavengeNode(),
    openDenDen: () => initDenDenNode(),
    openCamp: () => initCampNode(),
    close: () => closeNodeOverlay(),
    selectEnemy: (uid) => selectEnemy(uid),
    allyAction: (uid, action) => executeAllyAction(uid, action),
    allySkill: (uid, skillId) => executeAllySkill(uid, skillId),
    skipTurn: () => skipTurn()
});