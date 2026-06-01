// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/rng.js
//  Pure, stateless RNG utility functions. No side effects.
// ═══════════════════════════════════════════════════════════════════════════

import { DROP_RATES } from '../config/gameData.js';

/**
 * Returns a random integer between min and max, inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks a random element from an array.
 * @param {Array} array
 * @returns {*}
 */
export function pickFrom(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Weighted random pick. Each item's probability is proportional to its weight.
 * @param {Array}  items   – array of any values
 * @param {number[]} weights – parallel array of positive numbers
 * @returns {*} the selected item
 */
export function weightedPick(items, weights) {
  if (items.length !== weights.length) {
    throw new Error('[rng] items and weights arrays must be the same length');
  }
  const total = weights.reduce((sum, w) => sum + w, 0);
  let threshold = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Determines whether a Devil Fruit should drop this sail.
 * Returns true at a 2% rate only if the player has no existing fruit.
 * @param {boolean} hasExistingFruit
 * @param {number} chanceMultiplier - Modifier to base 2% chance
 * @returns {boolean}
 */
export function shouldDropDevilFruit(hasExistingFruit, chanceMultiplier = 1.0) {
  if (hasExistingFruit) return false;
  
  // Depending on how it's configured, DROP_RATES.DEVIL_FRUIT_CHANCE might be an integer (e.g. 1 for 1%, or 1 for 100%) or a float.
  // Since the original hardcoded value was 0.02 and the comment said 2%, 
  // if DEVIL_FRUIT_CHANCE is set to 1 by the user, it means 100% or 1.0. 
  // However, if they meant 1%, they would use 0.01. Let's just use the value directly since Math.random() is between 0 and 1.
  return Math.random() < (DROP_RATES.DEVIL_FRUIT_CHANCE * chanceMultiplier);
}

/**
 * Randomly selects a Sea of Origin from the SEAS config array.
 * @param {Array} seas – imported from gameData.js
 * @returns {Object} the selected sea object
 */
export function assignSea(seas) {
  return pickFrom(seas);
}

/**
 * Rolls a stat check: adds a random variance to a base stat and compares
 * against a difficulty threshold. Used for event resolution.
 * @param {number} statValue  – the character's relevant stat (attack/defense/accuracy)
 * @param {number} threshold  – minimum combined value to succeed
 * @param {number} [variance=10] – dice range ± applied to the stat
 * @returns {{ success: boolean, roll: number }}
 */
export function rollStatCheck(statValue, threshold, variance = 10) {
  const dice = roll(1, variance);
  const total = statValue + dice;
  return { success: total >= threshold, total, dice };
}

/**
 * Applies a gold multiplier and returns the final integer gold value.
 * @param {number} baseGold
 * @param {number} multiplier
 * @returns {number}
 */
export function applyGoldMultiplier(baseGold, multiplier) {
  return Math.round(baseGold * multiplier);
}

/**
 * Randomly pick N unique items from an array (without replacement).
 * @param {Array}  array
 * @param {number} n
 * @returns {Array}
 */
export function pickN(array, n) {
  const copy = [...array];
  const result = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}
