// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/rng.js
//  Pure, stateless RNG utility functions. Handles d20 tabletop mechanics.
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
 * Simulates rolling a specific number of dice with a specific number of sides.
 * Example: rollDice(2, 6) rolls 2d6.
 * @param {number} count - The number of dice to roll.
 * @param {number} sides - The number of sides on the dice.
 * @returns {number} The total result of the roll.
 */
export function rollDice(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += roll(1, sides);
  }
  return total;
}

/**
 * Simulates a standard 1d20 tabletop roll.
 * @returns {number} A value from 1 to 20.
 */
export function rollD20() {
  return roll(1, 20);
}

/**
 * Executes a standard D&D ability check or saving throw.
 * @param {number} modifier - The character's ability modifier (e.g., +3).
 * @param {number} proficiencyBonus - The proficiency bonus (if proficient), otherwise 0.
 * @param {number} dc - The Difficulty Class to beat.
 * @returns {{ success: boolean, roll: number, total: number, isCritical: boolean }}
 */
export function rollStatCheck(modifier, proficiencyBonus, dc) {
  const d20 = rollD20();
  const total = d20 + modifier + proficiencyBonus;

  // Natural 20 always succeeds, Natural 1 always fails
  if (d20 === 20) return { success: true, roll: d20, total, isCritical: true };
  if (d20 === 1) return { success: false, roll: d20, total, isCritical: true };

  return {
    success: total >= dc,
    roll: d20,
    total,
    isCritical: false
  };
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
 * Returns true at a set rate only if the player has no existing fruit.
 * @param {boolean} hasExistingFruit
 * @param {number} chanceMultiplier - Modifier to base drop chance
 * @returns {boolean}
 */
export function shouldDropDevilFruit(hasExistingFruit, chanceMultiplier = 1.0) {
  if (hasExistingFruit) return false;
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