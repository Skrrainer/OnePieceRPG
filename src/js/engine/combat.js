// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/combat.js
//  Individual Turn-Based D&D Combat Engine with Skills & Initiative.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, applyEventOutcome, getArmorClass, getModifier } from './playerState.js';
import { getCrew, modifyCrewHp } from './crewState.js';
import { ENCOUNTERS, spawnEnemy } from '../config/enemies.js';
import { CLASSES } from '../config/gameData.js';
import { showToast } from '../ui/renderEvents.js';
import { rollD20 } from './rng.js';

let combatState = {
    isActive: false,
    allies: [],
    enemies: [],
    initiativeQueue: [],
    currentTurnIndex: 0,
    activeCombatantUid: null,
    selectedEnemyUid: null,
    onStateChange: null,
    onCombatEnd: null
};

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
    combatState.onStateChange = onStateChange;
    combatState.onCombatEnd = onCombatEnd;
    combatState.initiativeQueue = [];
    combatState.currentTurnIndex = 0;

    const player = getState();
    const crew = getCrew();

    const playerStrMod = getModifier('str');
    const playerDexMod = getModifier('dex');
    const playerPrimaryMod = Math.max(playerStrMod, playerDexMod);
    const playerProficiency = Math.ceil(1 + (player.level / 4));
    const playerRole = (player.role || player.combat_style || 'CAPTAIN').toUpperCase();

    combatState.allies = [
        {
            uid: 'player',
            name: 'Captain ' + player.name,
            icon: '🏴‍☠️',
            roleKey: playerRole,
            attributes: player.attributes,
            hp: player.hp,
            maxHp: player.maxHp,
            ac: getArmorClass(),
            attackBonus: playerPrimaryMod + playerProficiency,
            damageDice: player.equipment?.weapon?.damageDice || '1d4',
            block: 0,
            isPlayer: true,
            initiative: rollD20() + playerDexMod,
            unlockedSkills: player.unlockedSkills || [],
            devilFruit: player.hasFruit ? player.devilFruit : null
        },
        ...crew.map(c => {
            const roleKey = (c.role || c.combat_style || 'CAPTAIN').toUpperCase();
            const roleCfg = CLASSES[roleKey] || CLASSES['CAPTAIN'];
            const safeAttributes = c.attributes?.str ? c.attributes : roleCfg.baseAttributes;
            const cLevel = c.level || 1;

            const cStrMod = Math.floor((safeAttributes.str - 10) / 2);
            const cDexMod = Math.floor((safeAttributes.dex - 10) / 2);
            const cConMod = Math.floor((safeAttributes.con - 10) / 2);
            const cPrimaryMod = Math.max(cStrMod, cDexMod);
            const cProficiency = Math.ceil(1 + (cLevel / 4));

            const armorAc = c.equipment?.armor?.baseAc || 10;
            const weaponDice = c.equipment?.weapon?.damageDice || '1d6';

            const properMaxHp = Math.max(1, (roleCfg.hitDie + cConMod)) * cLevel;
            const displayHp = Math.min(c.hp || properMaxHp, properMaxHp);

            return {
                uid: `crew_${c.id}`,
                name: c.name,
                icon: roleCfg.icon,
                roleKey: roleKey,
                attributes: safeAttributes,
                hp: displayHp,
                maxHp: properMaxHp,
                ac: armorAc + cDexMod,
                attackBonus: cPrimaryMod + cProficiency,
                damageDice: weaponDice,
                block: 0,
                isPlayer: false,
                initiative: rollD20() + cDexMod,
                unlockedSkills: c.unlockedSkills || [],
                devilFruit: null // Currently, only captains have explicit fruits in the state
            };
        })
    ];

    const encounterKeys = ENCOUNTERS[encounterKey] || ENCOUNTERS.EASY_PATROL;
    combatState.enemies = encounterKeys.map((key, index) => {
        const enemy = spawnEnemy(key, index);
        enemy.initiative = rollD20() + 2;
        return enemy;
    });

    if (combatState.enemies.length > 0) {
        combatState.selectedEnemyUid = combatState.enemies[0].uid;
    }

    const allCombatants = [...combatState.allies, ...combatState.enemies];
    allCombatants.sort((a, b) => b.initiative - a.initiative);
    combatState.initiativeQueue = allCombatants.map(c => c.uid);
    combatState.activeCombatantUid = combatState.initiativeQueue[0];

    _pickEnemyIntents();
    combatState.onStateChange(combatState);

    if (_isEnemy(combatState.activeCombatantUid)) {
        setTimeout(() => _executeEnemyTurn(), 1000);
    }
}

export function selectEnemy(enemyUid) {
    if (!combatState.isActive) return;
    combatState.selectedEnemyUid = enemyUid;
    combatState.onStateChange(combatState);
}

export function skipTurn() {
    if (!combatState.isActive) return;
    const activeUid = combatState.activeCombatantUid;
    const ally = combatState.allies.find(a => a.uid === activeUid);

    if (ally) {
        showToast(`⏭️ ${ally.name} skipped their turn.`, 'info');
        _advanceTurn();
    }
}

export function executeAllyAction(allyUid, actionType) {
    if (!combatState.isActive || combatState.activeCombatantUid !== allyUid) return;

    const ally = combatState.allies.find(a => a.uid === allyUid);
    const targetEnemy = combatState.enemies.find(e => e.uid === combatState.selectedEnemyUid);

    if (!ally || ally.hp <= 0 || !targetEnemy) return;

    if (actionType === 'attack') {
        const attackRoll = rollD20();
        const totalHit = attackRoll + ally.attackBonus;
        const targetAc = (targetEnemy.ac || 10) + (targetEnemy.block || 0);

        if (attackRoll === 20 || (attackRoll !== 1 && totalHit >= targetAc)) {
            const isCrit = attackRoll === 20;
            let dmg = rollDamage(ally.damageDice, ally.attackBonus);
            if (isCrit) dmg += rollDamage(ally.damageDice, 0);

            targetEnemy.hp -= dmg;
            showToast(`⚔️ ${ally.name} hit ${targetEnemy.name} for ${dmg} DMG! ${isCrit ? '(CRITICAL!)' : ''}`, 'success', 2000);
        } else {
            showToast(`💨 ${ally.name} missed! (Rolled ${totalHit} vs AC ${targetAc})`, 'info', 2000);
        }
    } else if (actionType === 'defend') {
        ally.block = 4;
        showToast(`🛡️ ${ally.name} takes a defensive stance (+4 AC).`, 'info', 1500);
    }

    _checkEnemyDeath(targetEnemy);
}

export function executeAllySkill(allyUid, skillId) {
    if (!combatState.isActive || combatState.activeCombatantUid !== allyUid) return;
    const ally = combatState.allies.find(a => a.uid === allyUid);
    const targetEnemy = combatState.enemies.find(e => e.uid === combatState.selectedEnemyUid);
    if (!ally || ally.hp <= 0) return;

    const roleCfg = CLASSES[ally.roleKey];

    // Check if the skill belongs to their class, or their Devil Fruit
    let skill = roleCfg.skillTree.find(s => s.id === skillId);
    if (!skill && ally.devilFruit && ally.devilFruit.skills) {
        skill = ally.devilFruit.skills.find(s => s.id === skillId);
    }

    if (!skill) return;

    if (skill.type === 'attack') {
        if (!targetEnemy) return;
        const attackRoll = rollD20();
        const totalHit = attackRoll + ally.attackBonus;
        const targetAc = (targetEnemy.ac || 10) + (targetEnemy.block || 0);

        if (attackRoll === 20 || (attackRoll !== 1 && totalHit >= targetAc)) {
            let dmg = rollDamage(ally.damageDice, ally.attackBonus);
            dmg = Math.floor(dmg * skill.mult);
            if (attackRoll === 20) dmg += rollDamage(ally.damageDice, 0);

            targetEnemy.hp -= dmg;
            showToast(`✨ ${ally.name} used ${skill.name}! ${dmg} DMG!`, 'success', 2500);
        } else {
            showToast(`💨 ${ally.name} used ${skill.name} but missed!`, 'info', 2000);
        }
    } else if (skill.type === 'heal') {
        const statVal = ally.attributes ? ally.attributes[skill.stat] : 10;
        const statMod = Math.floor((statVal - 10) / 2);
        const healAmt = rollDamage(skill.healDice, statMod);
        ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
        showToast(`✨ ${ally.name} used ${skill.name} and healed ${healAmt} HP!`, 'success', 2500);
    } else if (skill.type === 'buff') {
        ally.block += skill.amount;
        showToast(`✨ ${ally.name} used ${skill.name}! (+${skill.amount} AC)`, 'info', 2000);
    }

    _checkEnemyDeath(targetEnemy);
}

function _checkEnemyDeath(targetEnemy) {
    if (targetEnemy && targetEnemy.hp <= 0) {
        showToast(`💀 ${targetEnemy.name} was defeated!`, 'gold', 2000);
        combatState.enemies = combatState.enemies.filter(e => e.uid !== targetEnemy.uid);
        combatState.initiativeQueue = combatState.initiativeQueue.filter(uid => uid !== targetEnemy.uid);

        if (combatState.enemies.length > 0) {
            combatState.selectedEnemyUid = combatState.enemies[0].uid;
        } else {
            _endCombat(true);
            return;
        }
    }
    _advanceTurn();
}

function _executeEnemyTurn() {
    if (!combatState.isActive) return;

    const activeUid = combatState.activeCombatantUid;
    const enemy = combatState.enemies.find(e => e.uid === activeUid);
    if (!enemy || enemy.hp <= 0) {
        _advanceTurn();
        return;
    }

    const intent = enemy.intents[enemy.currentIntentIndex];
    const targetAlly = combatState.allies.find(a => a.uid === enemy.targetUid);

    if (targetAlly && targetAlly.hp > 0) {
        if (intent.type === 'attack') {
            const attackRoll = rollD20();
            const enemyAttackBonus = 3;
            const totalHit = attackRoll + enemyAttackBonus;
            const targetAc = targetAlly.ac + targetAlly.block;

            if (attackRoll === 20 || (attackRoll !== 1 && totalHit >= targetAc)) {
                let dmg = intent.value;
                if (attackRoll === 20) dmg = Math.floor(dmg * 1.5);

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
            enemy.block = 2;
            showToast(`🛡️ ${enemy.name} is guarding.`, 'info', 1500);
        }
    }

    const playerAlly = combatState.allies.find(a => a.isPlayer);
    if (playerAlly.hp <= 0) {
        _endCombat(false);
        return;
    }

    setTimeout(() => _advanceTurn(), 1000);
}

function _advanceTurn() {
    if (!combatState.isActive) return;

    const prevCombatant = _getCombatant(combatState.activeCombatantUid);
    if (prevCombatant) prevCombatant.block = 0;

    combatState.currentTurnIndex++;
    if (combatState.currentTurnIndex >= combatState.initiativeQueue.length) {
        combatState.currentTurnIndex = 0;
        _pickEnemyIntents();
    }

    combatState.activeCombatantUid = combatState.initiativeQueue[combatState.currentTurnIndex];

    const nextCombatant = _getCombatant(combatState.activeCombatantUid);
    if (!nextCombatant || nextCombatant.hp <= 0) {
        _advanceTurn();
        return;
    }

    combatState.onStateChange(combatState);

    if (_isEnemy(combatState.activeCombatantUid)) {
        setTimeout(() => _executeEnemyTurn(), 1000);
    }
}

function _pickEnemyIntents() {
    const aliveAllies = combatState.allies.filter(a => a.hp > 0);
    for (const enemy of combatState.enemies) {
        const intentCount = enemy.intents.length;
        enemy.currentIntentIndex = Math.floor(Math.random() * intentCount);

        if (aliveAllies.length > 0) {
            const randomAlly = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
            enemy.targetUid = randomAlly.uid;
        }
    }
}

function _getCombatant(uid) {
    return combatState.allies.find(a => a.uid === uid) || combatState.enemies.find(e => e.uid === uid);
}

function _isEnemy(uid) {
    return combatState.enemies.some(e => e.uid === uid);
}

function _endCombat(playerWon) {
    combatState.isActive = false;
    if (combatState.onCombatEnd) {
        combatState.onCombatEnd(playerWon);
    }
}