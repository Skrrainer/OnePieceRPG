// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/playerState.js
//  In-memory player state container. No business logic, pure state mutations.
// ═══════════════════════════════════════════════════════════════════════════

import { ISLANDS } from '../../config/islands.js';

/** @type {PlayerState} */
let state = {};

export function initState(data) {
  let initialIslandId = data.currentIsland ?? data.current_island ?? 'g_1';
  const foundIsland = ISLANDS.find(i => i.name === initialIslandId);
  if (foundIsland) {
    initialIslandId = foundIsland.id;
  }

  state = {
    id:           data.id           ?? crypto.randomUUID(),
    name:         data.name         ?? 'Unknown Pirate',
    passcode:     data.passcode     ?? '',
    combatStyle:  data.combatStyle  ?? data.combat_style ?? 'BRAWLER',
    seaOfOrigin:  data.seaOfOrigin  ?? data.sea_of_origin ?? null,
    day:          data.day          ?? 1,
    hp:           data.hp           ?? 100,
    maxHp:        data.maxHp        ?? data.max_hp ?? 100,
    gold:         data.gold         ?? 250,
    bounty:       data.bounty       ?? 0,
    shipHp:       data.shipHp       ?? data.ship_hp ?? 100,
    shipHpMax:    data.shipHpMax    ?? data.ship_hp_max ?? 100,
    attack:       data.attack       ?? 5,
    defense:      data.defense      ?? 5,
    accuracy:     data.accuracy     ?? 5,
    devilFruit:   data.devilFruit   ?? data.devil_fruit_obj ?? null,
    hasFruit:     data.hasFruit     ?? data.has_fruit ?? false,
    cannonballs:  data.cannonballs  ?? 0,
    currentIsland: initialIslandId,
    food:         data.food         ?? 100,
    cola:         data.cola         ?? 100,
    logPoseCharge: data.logPoseCharge ?? data.log_pose_charge ?? 0,
    inventory:    (data.inventory ?? (data.startingItem ? [data.startingItem] : [])).map(i => typeof i === 'string' ? { id: i, name: i, icon: i === 'Provisions' ? '🥩' : '📦', type: 'consumable' } : i),
  };
}

export function getState() {
  return { ...state };
}

export function setCurrentIsland(islandId) {
  state.currentIsland = islandId;
}

export function applyEventOutcome({ hp = 0, gold = 0, incrementDay = false } = {}) {
  state.hp   = Math.max(0, Math.min(state.maxHp, state.hp + hp));
  state.gold = Math.max(0, state.gold + gold);
  if (incrementDay) state.day += 1;
}

export function incrementDay() {
  state.day += 1;
}

export function equipDevilFruit(fruit) {
  if (state.hasFruit) return;
  state.devilFruit = fruit;
  state.hasFruit   = true;
  if (fruit.statMod) {
    state.attack   += fruit.statMod.attack   ?? 0;
    state.defense  += fruit.statMod.defense  ?? 0;
    state.accuracy += fruit.statMod.accuracy ?? 0;
  }
}

export function restoreHp(amount) {
  state.hp = Math.min(state.maxHp, state.hp + amount);
}

export function repairShip(amount) {
  state.shipHp = Math.min(state.shipHpMax, state.shipHp + amount);
}

export function spendGold(cost) {
  if (state.gold < cost) return false;
  state.gold -= cost;
  return true;
}

export function modifyFood(amount) {
  state.food = Math.max(0, state.food + amount);
}

export function modifyCola(amount) {
  state.cola = Math.max(0, state.cola + amount);
}

// Ensure the charge is always a strict integer and capped at 3
export function chargeLogPose(amount = 1) {
  let currentCharge = parseInt(state.logPoseCharge, 10);
  if (isNaN(currentCharge)) currentCharge = 0;

  currentCharge += amount;
  state.logPoseCharge = Math.min(3, currentCharge);
}

export function resetLogPose() {
  state.logPoseCharge = 0;
}

export function addInventoryItem(item) {
  const itemObj = typeof item === 'string'
      ? { id: item.toLowerCase(), name: item, icon: item === 'Provisions' ? '🥩' : '📦', type: 'consumable' }
      : item;

  if (itemObj.type === 'devil_fruit' && state.inventory.some(i => i.id === itemObj.id)) {
    return;
  }

  state.inventory.push(itemObj);
}

export function removeInventoryItem(index) {
  state.inventory.splice(index, 1);
}

export function addCannonballs(count) {
  state.cannonballs += count;
}

export function patchStats(mods = {}) {
  if (mods.attack)   state.attack   += mods.attack;
  if (mods.defense)  state.defense  += mods.defense;
  if (mods.accuracy) state.accuracy += mods.accuracy;
  if (mods.maxHp)    state.maxHp    += mods.maxHp;
  if (mods.bounty)   state.bounty   += mods.bounty;
}

export function isDead() {
  return state.hp <= 0;
}

export function toSaveObject() {
  let encodedPasscode = state.passcode;
  try {
    if (btoa(atob(state.passcode)) !== state.passcode) {
      encodedPasscode = btoa(state.passcode);
    }
  } catch (e) {
    encodedPasscode = btoa(state.passcode);
  }

  // Force strict formatting for the payload
  const safeLogPose = parseInt(state.logPoseCharge, 10);

  return {
    id:               state.id,
    name:             state.name,
    passcode:         encodedPasscode,
    combat_style:     state.combatStyle,
    sea_of_origin:    typeof state.seaOfOrigin === 'object' ? state.seaOfOrigin?.id : state.seaOfOrigin,
    day:              state.day,
    hp:               state.hp,
    max_hp:           state.maxHp,
    gold:             state.gold,
    bounty:           state.bounty,
    ship_hp:          state.shipHp,
    ship_hp_max:      state.shipHpMax,
    attack:           state.attack,
    defense:          state.defense,
    accuracy:         state.accuracy,
    devil_fruit:      state.devilFruit?.id ?? null,
    has_fruit:        state.hasFruit,
    inventory:        state.inventory || [],
    current_island:   ISLANDS.find(i => i.id === state.currentIsland)?.name || state.currentIsland || 'g_1',
    food:             state.food,
    cola:             state.cola,
    log_pose_charge:  isNaN(safeLogPose) ? 0 : safeLogPose
  };
}