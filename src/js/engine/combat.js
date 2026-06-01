// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/combat.js
//  Intent-driven turn-based combat state and resolution logic.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, restoreHp, applyEventOutcome } from './playerState.js';
import { spawnEnemy } from '../config/enemies.js';

let combatState = {
    isActive: false,
    playerEnergy: 3,
    playerMaxEnergy: 3,
    playerBlock: 0,
    enemy: null,
    turn: 1,
    onStateChange: null,
    onCombatEnd: null
};

export function startCombat(enemyKey, onStateChange, onCombatEnd) {
    combatState.isActive = true;
    combatState.playerEnergy = combatState.playerMaxEnergy;
    combatState.playerBlock = 0;
    combatState.enemy = spawnEnemy(enemyKey);
    combatState.turn = 1;
    combatState.onStateChange = onStateChange;
    combatState.onCombatEnd = onCombatEnd;

    _pickEnemyIntent();
    combatState.onStateChange(combatState);
}

export function executePlayerAction(actionType) {
    if (!combatState.isActive) return;
    const playerStats = getState();

    // Base actions cost 1 energy
    if (combatState.playerEnergy < 1) return;
    combatState.playerEnergy -= 1;

    if (actionType === 'attack') {
        const dmg = playerStats.attack;
        let remainingDmg = dmg;

        if (combatState.enemy.block > 0) {
            if (remainingDmg >= combatState.enemy.block) {
                remainingDmg -= combatState.enemy.block;
                combatState.enemy.block = 0;
            } else {
                combatState.enemy.block -= remainingDmg;
                remainingDmg = 0;
            }
        }
        combatState.enemy.hp -= remainingDmg;
    } else if (actionType === 'defend') {
        combatState.playerBlock += playerStats.defense;
    }

    if (combatState.enemy.hp <= 0) {
        _endCombat(true);
        return;
    }

    combatState.onStateChange(combatState);
}

export function endPlayerTurn() {
    if (!combatState.isActive) return;

    // Resolve Enemy Intent
    const intent = combatState.enemy.intents[combatState.enemy.currentIntentIndex];

    if (intent.type === 'attack') {
        let dmg = intent.value;
        if (combatState.playerBlock > 0) {
            if (dmg >= combatState.playerBlock) {
                dmg -= combatState.playerBlock;
                combatState.playerBlock = 0;
            } else {
                combatState.playerBlock -= dmg;
                dmg = 0;
            }
        }
        if (dmg > 0) {
            applyEventOutcome({ hp: -dmg });
        }
    } else if (intent.type === 'defend') {
        combatState.enemy.block += intent.value;
    }

    const playerStats = getState();
    if (playerStats.hp <= 0) {
        _endCombat(false);
        return;
    }

    // Reset for next turn
    combatState.turn += 1;
    combatState.playerEnergy = combatState.playerMaxEnergy;
    combatState.playerBlock = 0;
    combatState.enemy.block = 0; // Enemy block resets too
    _pickEnemyIntent();

    combatState.onStateChange(combatState);
}

function _pickEnemyIntent() {
    // Simple cycle for now; could be randomized
    const intentCount = combatState.enemy.intents.length;
    combatState.enemy.currentIntentIndex = (combatState.turn - 1) % intentCount;
}

function _endCombat(playerWon) {
    combatState.isActive = false;
    if (combatState.onCombatEnd) {
        combatState.onCombatEnd(playerWon);
    }
}