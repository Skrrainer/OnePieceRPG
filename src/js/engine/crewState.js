// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/crewState.js
//  In-memory cache of the player's recruited crew, auto-leveling, and equip logic.
// ═══════════════════════════════════════════════════════════════════════════

import { LEVEL_THRESHOLDS, CLASSES } from '../config/gameData.js';

/** @type {Array} */
let _crew = [];

export function setCrew(members) {
  _crew = Array.isArray(members) ? [...members] : [];
}

export function addToCrewCache(member) {
  // Ensure basic structure exists for new recruits
  if (!member.attributes) {
    const roleCfg = CLASSES[member.role || 'CAPTAIN'] || CLASSES['CAPTAIN'];
    member.attributes = { ...roleCfg.baseAttributes };
  }
  if (!member.equipment) member.equipment = {};
  if (!member.exp) member.exp = 0;
  if (!member.level) member.level = 1;

  _crew.push(member);
}

export function getCrew() {
  return [..._crew];
}

export function modifyCrewHp(crewId, delta) {
  const member = _crew.find(c => c.id === crewId);
  if (member) {
    member.hp = Math.max(0, Math.min(member.max_hp || 100, member.hp + delta));
    return member.hp;
  }
  return 0;
}

/**
 * Grants EXP to all crew members and handles automatic stat allocation on level up.
 * Returns true if anyone leveled up so the UI knows to show a toast.
 */
export function gainCrewExp(amount) {
  let leveledUp = false;

  _crew.forEach(member => {
    member.exp = (member.exp || 0) + amount;
    let currentLevel = member.level || 1;
    let memberLeveled = false;

    while (currentLevel < LEVEL_THRESHOLDS.length && member.exp >= LEVEL_THRESHOLDS[currentLevel]) {
      currentLevel++;
      memberLeveled = true;
      leveledUp = true;

      // Auto-assign stats based on class proficiencies
      const roleKey = member.role || member.combat_style || 'CAPTAIN';
      const roleCfg = CLASSES[roleKey] || CLASSES['CAPTAIN'];
      const primaryStat = roleCfg.proficiencies[0] || 'str';
      const secondaryStat = roleCfg.proficiencies[1] || 'con';

      if (!member.attributes) member.attributes = { ...roleCfg.baseAttributes };

      // +1 to primary stat every level, +1 to secondary every other level
      member.attributes[primaryStat] += 1;
      if (currentLevel % 2 === 0) {
        member.attributes[secondaryStat] += 1;
      }

      // Recalculate Max HP
      const conMod = Math.floor((member.attributes.con - 10) / 2);
      const hpGain = Math.max(1, roleCfg.hitDie + conMod);
      member.max_hp = (member.max_hp || 10) + hpGain;
      member.hp = member.max_hp; // Heal to full on level up
    }

    if (memberLeveled) {
      member.level = currentLevel;
    }
  });

  return leveledUp;
}

/** Equips an item to a specific crew member's slot (weapon, armor, accessory). */
export function equipCrewMember(crewId, item) {
  const member = _crew.find(c => c.id === crewId);
  if (!member) return false;

  if (!member.equipment) member.equipment = {};
  member.equipment[item.type] = item;
  return true;
}