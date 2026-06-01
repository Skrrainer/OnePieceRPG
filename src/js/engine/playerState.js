// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/playerState.js
//  In-memory player state container. No business logic, pure state mutations.
// ═══════════════════════════════════════════════════════════════════════════

import { ISLANDS } from '../../config/islands.js';

/** @type {PlayerState} */
let state = {};

/**
 * @typedef {Object} PlayerState
 * @property {string}  id            – UUID (from Supabase or generated locally)
 * @property {string}  name          – Pirate name
 * @property {string}  passcode      - Pirate passcode
 * @property {string}  combatStyle   – 'BRAWLER' | 'SWORDSMAN' | 'SNIPER'
 * @property {Object}  seaOfOrigin   – sea object from SEAS config
 * @property {number}  day           – current voyage day
 * @property {number}  hp            – current HP
 * @property {number}  maxHp         – maximum HP
 * @property {number}  gold          – current Berries
 * @property {number}  bounty        – current Bounty
 * @property {number}  shipHp        – current ship hull points
 * @property {number}  shipHpMax     – max ship hull points
 * @property {number}  attack        – combat attack stat
 * @property {number}  defense       – combat defense stat
 * @property {number}  accuracy      – combat accuracy stat
 * @property {Object|null} devilFruit  – consumed fruit object or null
 * @property {boolean} hasFruit      – true if a fruit is equipped
 * @property {Object[]} inventory    – list of item objects
 * @property {number}  cannonballs   – remaining cannonball charges
 * @property {string}  currentIsland - the ID of the island they are currently on
 */

/**
 * Initialise state from raw data (character creation form or Supabase row).
 * @param {Partial<PlayerState>} data
 */
export function initState(data) {
  // If the database gave us an island name, map it back to its ID for internal logic
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
    inventory:    (data.inventory ?? (data.startingItem ? [data.startingItem] : [])).map(i => typeof i === 'string' ? { id: i, name: i, icon: i === 'Provisions' ? '🥩' : '📦', type: 'consumable' } : i),
  };
}

/**
 * Returns a shallow copy of the current state (prevents external mutation).
 * @returns {PlayerState}
 */
export function getState() {
  return { ...state };
}

/**
 * Sets the player's current island
 * @param {string} islandId
 */
export function setCurrentIsland(islandId) {
  state.currentIsland = islandId;
}

/**
 * Applies the outcome of a voyage event to the state.
 * HP is clamped between 0 and maxHp. Gold cannot go below 0.
 * Also increments the day counter.
 * @param {{ hp?: number, gold?: number, incrementDay?: boolean }} outcome
 */
export function applyEventOutcome({ hp = 0, gold = 0, incrementDay = false } = {}) {
  state.hp   = Math.max(0, Math.min(state.maxHp, state.hp + hp));
  state.gold = Math.max(0, state.gold + gold);
  if (incrementDay) state.day += 1;
}

/**
 * Increment day by 1 (called by gameLoop on each sail).
 */
export function incrementDay() {
  state.day += 1;
}

/**
 * Equip a Devil Fruit: apply stat mods and mark the player.
 * @param {Object} fruit – from DEVIL_FRUITS config
 */
export function equipDevilFruit(fruit) {
  if (state.hasFruit) return; // can only have one fruit
  state.devilFruit = fruit;
  state.hasFruit   = true;
  if (fruit.statMod) {
    state.attack   += fruit.statMod.attack   ?? 0;
    state.defense  += fruit.statMod.defense  ?? 0;
    state.accuracy += fruit.statMod.accuracy ?? 0;
  }
}

/**
 * Restore HP (e.g. Tavern rest). Clamps to maxHp.
 * @param {number} amount
 */
export function restoreHp(amount) {
  state.hp = Math.min(state.maxHp, state.hp + amount);
}

/**
 * Repair ship hull. Clamps to shipHpMax.
 * @param {number} amount
 */
export function repairShip(amount) {
  state.shipHp = Math.min(state.shipHpMax, state.shipHp + amount);
}

/**
 * Deduct gold. Returns false if insufficient funds.
 * @param {number} cost
 * @returns {boolean} success
 */
export function spendGold(cost) {
  if (state.gold < cost) return false;
  state.gold -= cost;
  return true;
}

/**
 * Add an item to inventory. Convert legacy strings into objects.
 * @param {Object|string} item
 */
export function addInventoryItem(item) {
  const itemObj = typeof item === 'string'
      ? { id: item.toLowerCase(), name: item, icon: item === 'Provisions' ? '🥩' : '📦', type: 'consumable' }
      : item;
      
  // Prevent duplicate devil fruits
  if (itemObj.type === 'devil_fruit' && state.inventory.some(i => i.id === itemObj.id)) {
    return;
  }
      
  state.inventory.push(itemObj);
}

/**
 * Remove an item from inventory by its index.
 * @param {number} index
 */
export function removeInventoryItem(index) {
  state.inventory.splice(index, 1);
}

/**
 * Add cannonball charges.
 * @param {number} count
 */
export function addCannonballs(count) {
  state.cannonballs += count;
}

/**
 * Apply arbitrary stat patches (e.g. from upgrades).
 * @param {{ attack?: number, defense?: number, accuracy?: number, maxHp?: number, bounty?: number }} mods
 */
export function patchStats(mods = {}) {
  if (mods.attack)   state.attack   += mods.attack;
  if (mods.defense)  state.defense  += mods.defense;
  if (mods.accuracy) state.accuracy += mods.accuracy;
  if (mods.maxHp)    state.maxHp    += mods.maxHp;
  if (mods.bounty)   state.bounty   += mods.bounty;
}

/**
 * @returns {boolean} true if the player is dead
 */
export function isDead() {
  return state.hp <= 0;
}

/**
 * Serialises state to a flat object suitable for Supabase upsert.
 * @returns {Object}
 */
export function toSaveObject() {
  // Check if passcode is already base64 encoded (a simple heuristic is checking if it contains spaces or isn't base64, but since we btoa it, it should be valid base64. However, it's safer to just send state.passcode directly if we already btoa'd it on auth, but let's just use state.passcode since login provides it raw, and localStorage provides it encoded. Wait, authenticatePlayer takes encoded. So state.passcode might be raw or encoded. To be completely safe, we'll store the raw passcode or encoded in state but consistently send the exact string to the DB without re-encoding unless we have to. Let's just remove btoa here and assume state.passcode is correct, but actually let's keep btoa only if it's not already encoded, or simply use btoa(state.passcode) BUT wait, that caused double encoding. Let's just return state.passcode. The auth system will just use it. Actually, wait! The creation form does NOT btoa the passcode before passing it to initState, so if we remove btoa here, creation will save raw passcode. Let's do a simple check: if the passcode is already base64 encoded (ends with = or contains only b64 chars and was loaded from DB), we don't re-encode. But a better fix is to just send the raw one if it's raw. 
  // Let's just send btoa(state.passcode) ONLY IF it doesn't look already btoa'd, or fix it by NOT double encoding.
  let encodedPasscode = state.passcode;
  try {
      if (btoa(atob(state.passcode)) !== state.passcode) {
          encodedPasscode = btoa(state.passcode);
      }
  } catch (e) {
      encodedPasscode = btoa(state.passcode);
  }

  return {
    id:           state.id,
    name:         state.name,
    passcode:     encodedPasscode,
    combat_style: state.combatStyle,
    sea_of_origin: typeof state.seaOfOrigin === 'object'
        ? state.seaOfOrigin?.id
        : state.seaOfOrigin,
    day:          state.day,
    hp:           state.hp,
    max_hp:       state.maxHp,
    gold:         state.gold,
    bounty:       state.bounty,
    ship_hp:      state.shipHp,
    ship_hp_max:  state.shipHpMax,
    attack:       state.attack,
    defense:      state.defense,
    accuracy:     state.accuracy,
    devil_fruit:   state.devilFruit?.id ?? null,
    has_fruit:     state.hasFruit,
    inventory:    state.inventory || [],
    current_island: ISLANDS.find(i => i.id === state.currentIsland)?.name || state.currentIsland || 'g_1',
  };
}