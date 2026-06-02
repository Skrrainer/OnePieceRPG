// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/combat.js
//  Squad-based intent-driven combat engine (d20 Mechanics).
// ═══════════════════════════════════════════════════════════════════════════

import { getState, applyEventOutcome, getArmorClass, getModifier } from './playerState.js';
import { getCrew, modifyCrewHp } from './crewState.js';
import { ENCOUNTERS, spawnEnemy } from '../config/enemies.js';
import { showToast } from '../ui/renderEvents.js';
import { rollD20 } from './rng.js';

let combatState = {
    isActive: false,
    fleetEnergy: 0,
    maxFleetEnergy: 0,
    allies: [],
    enemies: [],
    turn: 1,
    selectedEnemyUid: null,
    onStateChange: null,
    onCombatEnd: null
};

// ── Dice Helper ──
function rollDamage(diceStr, bonus = 0) {
    if (!diceStr) return Math.max(1, bonus);
    const parts = diceStr.toLowerCase().split('d');
    if (parts.length !== 2) return Math.max(1, bonus);

    const count = parseInt(parts[0], 10);
    const sides = parseInt(parts[1], 10);
    let total = 0;

    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
    }
    return Math.max(1, total + bonus);
}

export function startCombat(encounterKey, onStateChange, onCombatEnd) {
    combatState.isActive = true;
    combatState.turn = 1;
    combatState.onStateChange = onStateChange;
    combatState.onCombatEnd = onCombatEnd;

    // 1. Build Allies (Player + Crew) mapped to D&D Stats
    const player = getState();
    const crew = getCrew();

    // Calculate player base combat stats
    const playerStrMod = getModifier('str');
    const playerDexMod = getModifier('dex');
    const playerPrimaryMod = Math.max(playerStrMod, playerDexMod);
    const playerProficiency = Math.ceil(1 + (player.level / 4)); // Standard D&D scaling

    combatState.allies = [
        {
            uid: 'player',
            name: 'Captain ' + player.name,
            icon: '🏴‍☠️',
            hp: player.hp,
            maxHp: player.maxHp,
            ac: getArmorClass(),
            attackBonus: playerPrimaryMod + playerProficiency,
            damageDice: player.equipment?.weapon?.damageDice || '1d4',
            block: 0, // Represents temporary AC boosts (e.g. Defend action)
            isPlayer: true
        },
        ...crew.map(c => {
            const cStrMod = Math.floor(((c.attributes?.str || 10) - 10) / 2);
            const cDexMod = Math.floor(((c.attributes?.dex || 10) - 10) / 2);
            const cPrimaryMod = Math.max(cStrMod, cDexMod);
            const cProficiency = Math.ceil(1 + ((c.level || 1) / 4));

            const armorAc = c.equipment?.armor?.baseAc || 10;
            const weaponDice = c.equipment?.weapon?.damageDice || '1d6';

            return {
                uid: `crew_${c.id}`,
                name: c.name,
                icon: '🪝',
                hp: c.hp,
                maxHp: c.max_hp || c.hp,
                ac: armorAc + cDexMod,
                attackBonus: cPrimaryMod + cProficiency,
                damageDice: weaponDice,
                block: 0,
                isPlayer: false
            };
        })
    ];

    combatState.maxFleetEnergy = 3 + crew.length;
    combatState.fleetEnergy = combatState.maxFleetEnergy;

    // 2. Build Enemies
    const encounterKeys = ENCOUNTERS[encounterKey] || ENCOUNTERS.EASY_PATROL;
    combatState.enemies = encounterKeys.map((key, index) => spawnEnemy(key, index));
    combatState.selectedEnemyUid = combatState.enemies[0].uid;

    _pickEnemyIntents();
    combatState.onStateChange(combatState);
}

export function selectEnemy(enemyUid) {
    if (!combatState.isActive) return;
    combatState.selectedEnemyUid = enemyUid;
    combatState.onStateChange(combatState);
}

export function executeAllyAction(allyUid, actionType) {
    if (!combatState.isActive || combatState.fleetEnergy < 1) return;

    const ally = combatState.allies.find(a => a.uid === allyUid);
    const targetEnemy = combatState.enemies.find(e => e.uid === combatState.selectedEnemyUid);

    if (!ally || ally.hp <= 0 || !targetEnemy) return;

    combatState.fleetEnergy -= 1;

    if (actionType === 'attack') {
        const attackRoll = rollD20();
        const totalHit = attackRoll + ally.attackBonus;

        // Enemy AC defaults to 10 + any temporary block/defend buffs
        const targetAc = (targetEnemy.ac || 10) + (targetEnemy.block || 0);

        if (attackRoll === 20 || (attackRoll !== 1 && totalHit >= targetAc)) {
            // Hit!
            const isCrit = attackRoll === 20;
            let dmg = rollDamage(ally.damageDice, ally.attackBonus);
            if (isCrit) dmg += rollDamage(ally.damageDice, 0); // Roll damage twice on crit

            targetEnemy.hp -= dmg;
            showToast(`⚔️ ${ally.name} hit ${targetEnemy.name} for ${dmg} DMG! ${isCrit ? '(CRITICAL!)' : ''}`, 'success', 2000);
        } else {
            // Miss
            showToast(`💨 ${ally.name} missed! (Rolled ${totalHit} vs AC ${targetAc})`, 'info', 2000);
        }
    } else if (actionType === 'defend') {
        ally.block = 4; // Grants +4 AC until the start of the next turn
        showToast(`🛡️ ${ally.name} takes a defensive stance (+4 AC).`, 'info', 1500);
    }

    // Check Enemy Death
    if (targetEnemy.hp <= 0) {
        showToast(`💀 ${targetEnemy.name} was defeated!`, 'gold', 2000);
        combatState.enemies = combatState.enemies.filter(e => e.uid !== targetEnemy.uid);

        if (combatState.enemies.length > 0) {
            combatState.selectedEnemyUid = combatState.enemies[0].uid;
        } else {
            _endCombat(true);
            return;
        }
    }

    combatState.onStateChange(combatState);
}

export function endPlayerTurn() {
    if (!combatState.isActive) return;

    // Enemies Execute Intents
    for (const enemy of combatState.enemies) {
        const intent = enemy.intents[enemy.currentIntentIndex];
        const targetAlly = combatState.allies.find(a => a.uid === enemy.targetUid);

        if (!targetAlly || targetAlly.hp <= 0) continue;

        if (intent.type === 'attack') {
            const attackRoll = rollD20();
            const enemyAttackBonus = 3; // Base +3 for early game enemies
            const totalHit = attackRoll + enemyAttackBonus;

            const targetAc = targetAlly.ac + targetAlly.block;

            if (attackRoll === 20 || (attackRoll !== 1 && totalHit >= targetAc)) {
                // Hit!
                let dmg = intent.value;
                if (attackRoll === 20) dmg = Math.floor(dmg * 1.5); // 50% extra damage on enemy crits

                targetAlly.hp -= dmg;
                showToast(`💥 ${enemy.name} hit ${targetAlly.name} for ${dmg} DMG!`, 'danger', 2500);

                if (targetAlly.isPlayer) {
                    applyEventOutcome({ hp: -dmg });
                } else {
                    const crewId = targetAlly.uid.replace('crew_', '');
                    modifyCrewHp(crewId, -dmg);
                }
            } else {
                showToast(`🛡️ ${enemy.name} missed ${targetAlly.name}! (Rolled ${totalHit} vs AC ${targetAc})`, 'info', 2000);
            }
        } else if (intent.type === 'defend') {
            enemy.block = 2; // Enemies gain +2 AC
        }
    }

    // Check Player Death
    const playerAlly = combatState.allies.find(a => a.isPlayer);
    if (playerAlly.hp <= 0) {
        _endCombat(false);
        return;
    }

    // Setup Next Turn
    combatState.turn += 1;
    combatState.fleetEnergy = combatState.maxFleetEnergy;

    // Reset Blocks (Temporary AC)
    combatState.allies.forEach(a => a.block = 0);
    combatState.enemies.forEach(e => e.block = 0);

    _pickEnemyIntents();
    combatState.onStateChange(combatState);
}

function _pickEnemyIntents() {
    const aliveAllies = combatState.allies.filter(a => a.hp > 0);
    for (const enemy of combatState.enemies) {
        const intentCount = enemy.intents.length;
        enemy.currentIntentIndex = (combatState.turn - 1) % intentCount;

        // Pick random alive ally to target
        if (aliveAllies.length > 0) {
            const randomAlly = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
            enemy.targetUid = randomAlly.uid;
        }
    }
}

function _endCombat(playerWon) {
    combatState.isActive = false;
    if (combatState.onCombatEnd) {
        combatState.onCombatEnd(playerWon);
    }
}