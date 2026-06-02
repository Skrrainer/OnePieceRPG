// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/playerState.js
//  In-memory player state container adapted for d20 logic, equipment, and quests.
// ═══════════════════════════════════════════════════════════════════════════

import { ISLANDS } from '../../config/islands.js';
import { CLASSES, LEVEL_THRESHOLDS } from '../config/gameData.js';

/** @type {PlayerState} */
let state = {};

export function initState(data) {
  let initialIslandId = data.currentIsland ?? data.current_island ?? 'g_1';
  const foundIsland = ISLANDS.find(i => i.name === initialIslandId);
  if (foundIsland) {
    initialIslandId = foundIsland.id;
  }

  const role = data.role ?? data.class ?? data.combat_style ?? 'CAPTAIN';
  const roleData = CLASSES[role] || CLASSES['CAPTAIN'];
  const level = data.level ?? 1;

  const attributes = {
    str: data.attributes?.str ?? roleData.baseAttributes.str,
    dex: data.attributes?.dex ?? roleData.baseAttributes.dex,
    con: data.attributes?.con ?? roleData.baseAttributes.con,
    int: data.attributes?.int ?? roleData.baseAttributes.int,
    wis: data.attributes?.wis ?? roleData.baseAttributes.wis,
    cha: data.attributes?.cha ?? roleData.baseAttributes.cha,
  };

  state = {
    id:           data.id           ?? crypto.randomUUID(),
    name:         data.name         ?? 'Unknown Pirate',
    passcode:     data.passcode     ?? '',
    role:         role,
    seaOfOrigin:  data.seaOfOrigin  ?? data.sea_of_origin ?? null,
    day:          data.day          ?? 1,

    level:        level,
    exp:          data.exp          ?? 0,
    attributes:   attributes,

    statPoints:   data.statPoints   ?? data.stat_points ?? 0,
    spentPoints:  data.spentPoints  ?? data.spent_points ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },

    hp:           data.hp           ?? 100,
    maxHp:        data.maxHp        ?? data.max_hp ?? 100,

    gold:         data.gold         ?? 250,
    bounty:       data.bounty       ?? 0,
    shipHp:       data.shipHp       ?? data.ship_hp ?? 100,
    shipHpMax:    data.shipHpMax    ?? data.ship_hp_max ?? 100,
    food:         data.food         ?? 100,
    cola:         data.cola         ?? 100,
    cannonballs:  data.cannonballs  ?? 0,
    logPoseCharge: data.logPoseCharge ?? data.log_pose_charge ?? 0,

    devilFruit:   data.devilFruit   ?? data.devil_fruit_obj ?? null,
    hasFruit:     data.hasFruit     ?? data.has_fruit ?? false,
    skills:       data.skills       ?? [],

    activeQuest:  data.activeQuest  ?? data.active_quest ?? null,
    clearedIslands: data.clearedIslands ?? data.cleared_islands ?? [],

    equipment:    data.equipment    ?? { weapon: null, armor: null, accessory: null },
    inventory:    (data.inventory ?? []).map(i => typeof i === 'string' ? { id: i, name: i, icon: '📦', type: 'consumable' } : i),

    currentIsland: initialIslandId,
  };

  _recalcHp();
}

export function getState() {
  return { ...state };
}

// ── Progression Helpers ───────────────────────────────────────────────────

function _recalcHp() {
  const roleData = CLASSES[state.role] || CLASSES['CAPTAIN'];
  const conMod = Math.floor((state.attributes.con - 10) / 2);
  const calculatedMaxHp = Math.max(1, (roleData.hitDie + conMod)) * state.level;

  const oldMax = state.maxHp;
  state.maxHp = calculatedMaxHp;

  if (state.maxHp > oldMax) {
    state.hp += (state.maxHp - oldMax);
  }
  if (state.hp > state.maxHp) {
    state.hp = state.maxHp;
  }
}

export function gainExp(amount) {
  state.exp += amount;
  let leveledUp = false;

  while (LEVEL_THRESHOLDS[state.level] && state.exp >= LEVEL_THRESHOLDS[state.level]) {
    state.level += 1;
    state.statPoints += 2;
    leveledUp = true;
  }

  if (leveledUp) _recalcHp();
}

export function allocateStatPoint(statKey) {
  if (state.statPoints > 0) {
    state.statPoints -= 1;
    state.attributes[statKey] += 1;
    state.spentPoints[statKey] = (state.spentPoints[statKey] || 0) + 1;

    if (statKey === 'con') _recalcHp();
    return true;
  }
  return false;
}

export function resetStats() {
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    const pointsSpent = state.spentPoints[key] || 0;
    state.attributes[key] -= pointsSpent;
    state.statPoints += pointsSpent;
    state.spentPoints[key] = 0;
  }
  _recalcHp();
}

// ── Mechanics Helpers ─────────────────────────────────────────────────────

export function getModifier(attributeKey) {
  let score = state.attributes[attributeKey];
  if (score === undefined) return 0;

  if (state.equipment?.accessory?.attributeBuffs?.[attributeKey]) {
    score += state.equipment.accessory.attributeBuffs[attributeKey];
  }
  return Math.floor((score - 10) / 2);
}

export function getArmorClass() {
  const dexMod = getModifier('dex');
  const armor = state.equipment.armor;

  if (!armor) return 10 + dexMod;

  let totalAc = armor.baseAc || 10;
  if (armor.dexCap !== undefined) {
    totalAc += Math.min(dexMod, armor.dexCap);
  } else {
    totalAc += dexMod;
  }
  return totalAc;
}

export function equipDevilFruit(fruit) {
  if (state.hasFruit) return;
  state.devilFruit = fruit;
  state.hasFruit   = true;
  if (fruit.attributeBuffs) {
    for (const [attr, buff] of Object.entries(fruit.attributeBuffs)) {
      if (state.attributes[attr] !== undefined) {
        state.attributes[attr] += buff;
      }
    }
  }
}

// ── Quest & Island Progression ────────────────────────────────────────────

export function setActiveQuest(quest) { state.activeQuest = quest; }
export function advanceQuestStage() { if (state.activeQuest) state.activeQuest.stage += 1; }
export function clearCurrentIsland() {
  if (!state.clearedIslands.includes(state.currentIsland)) {
    state.clearedIslands.push(state.currentIsland);
  }
}

// ── Equipment Management ──────────────────────────────────────────────────

export function equipItem(item) {
  if (!item || !item.slot) return false;
  if (state.equipment[item.slot]) state.inventory.push(state.equipment[item.slot]);
  state.equipment[item.slot] = item;
  return true;
}

export function unequipItem(slot) {
  if (!state.equipment[slot]) return false;
  state.inventory.push(state.equipment[slot]);
  state.equipment[slot] = null;
  return true;
}

// ── Standard Resource Mutators ────────────────────────────────────────────

export function setCurrentIsland(islandId) { state.currentIsland = islandId; }
export function applyEventOutcome({ hp = 0, gold = 0, incrementDay = false } = {}) {
  state.hp   = Math.max(0, Math.min(state.maxHp, state.hp + hp));
  state.gold = Math.max(0, state.gold + gold);
  if (incrementDay) incrementDay();
}
export function incrementDay() {
  state.day += 1;
  let currentCharge = parseInt(state.logPoseCharge, 10) || 0;
  state.logPoseCharge = Math.min(3, currentCharge + 1); // Passing time charges the pose
}
export function restoreHp(amount) { state.hp = Math.min(state.maxHp, state.hp + amount); }
export function repairShip(amount) { state.shipHp = Math.min(state.shipHpMax, state.shipHp + amount); }
export function spendGold(cost) {
  if (state.gold < cost) return false;
  state.gold -= cost;
  return true;
}
export function modifyFood(amount) { state.food = Math.max(0, state.food + amount); }
export function modifyCola(amount) { state.cola = Math.max(0, state.cola + amount); }
export function chargeLogPose(amount = 1) {
  let currentCharge = parseInt(state.logPoseCharge, 10) || 0;
  state.logPoseCharge = Math.min(3, currentCharge + amount);
}
export function resetLogPose() { state.logPoseCharge = 0; }
export function addInventoryItem(item) {
  const itemObj = typeof item === 'string' ? { id: item.toLowerCase(), name: item, icon: '📦', type: 'consumable' } : item;
  if (itemObj.type === 'devil_fruit' && state.inventory.some(i => i.id === itemObj.id)) return;
  state.inventory.push(itemObj);
}
export function removeInventoryItem(index) { state.inventory.splice(index, 1); }

export function patchStats(mods = {}) {
  if (mods.str) state.attributes.str += mods.str;
  if (mods.dex) state.attributes.dex += mods.dex;
  if (mods.con) state.attributes.con += mods.con;
  if (mods.int) state.attributes.int += mods.int;
  if (mods.wis) state.attributes.wis += mods.wis;
  if (mods.cha) state.attributes.cha += mods.cha;
}

export function isDead() { return state.hp <= 0; }

// ── Serialization ─────────────────────────────────────────────────────────

export function toSaveObject() {
  let encodedPasscode = state.passcode;
  try {
    if (btoa(atob(state.passcode)) !== state.passcode) encodedPasscode = btoa(state.passcode);
  } catch (e) {
    encodedPasscode = btoa(state.passcode);
  }

  const safeLogPose = parseInt(state.logPoseCharge, 10);

  return {
    id:               state.id,
    name:             state.name,
    passcode:         encodedPasscode,
    role:             state.role,
    combat_style:     state.role,
    sea_of_origin:    typeof state.seaOfOrigin === 'object' ? state.seaOfOrigin?.id : state.seaOfOrigin,
    day:              state.day,
    level:            state.level,
    exp:              state.exp,
    attributes:       state.attributes,
    stat_points:      state.statPoints,
    spent_points:     state.spentPoints,
    hp:               state.hp,
    max_hp:           state.maxHp,
    gold:             state.gold,
    bounty:           state.bounty,
    ship_hp:          state.shipHp,
    ship_hp_max:      state.shipHpMax,
    devil_fruit:      state.devilFruit?.id ?? null,
    has_fruit:        state.hasFruit,
    skills:           state.skills,
    equipment:        state.equipment,
    active_quest:     state.activeQuest,
    cleared_islands:  state.clearedIslands,
    inventory:        state.inventory || [],
    current_island:   ISLANDS.find(i => i.id === state.currentIsland)?.name || state.currentIsland || 'g_1',
    food:             state.food,
    cola:             state.cola,
    log_pose_charge:  isNaN(safeLogPose) ? 0 : safeLogPose
  };
}