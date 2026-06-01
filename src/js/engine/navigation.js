// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/navigation.js
//  Calculates proximity and travel times based on map coordinates.
// ═══════════════════════════════════════════════════════════════════════════

import { ISLANDS } from '../../config/islands.js';
import { getState } from './playerState.js';

const DIRECTED_PATHS = {
  'west_blue_gl1': ['west_blue_gl2'],
  'west_blue_gl2': ['center'],
  'south_blue_gl1': ['south_blue_gl2'],
  'south_blue_gl2': ['center'],
  'east_blue_gl1': ['east_blue_gl2'],
  'east_blue_gl2': ['center'],
  'north_blue_gl1': ['north_blue_gl2'],
  'north_blue_gl2': ['center'],
  'center': ['gl2'],
  'gl2': ['gl1']
};

/**
 * Generates a set of the closest islands for the player to choose from.
 * Enforces directed paths if the current island is part of the predefined sequence.
 * Uses Pythagorean distance based on x/y coordinates as a fallback.
 * @returns {Array} Array of island objects
 */
export function generateLogPoseDestinations() {
  const state = getState();
  const current = ISLANDS.find(i => i.id === state.currentIsland);

  if (!current) {
    // Fallback if current island is invalid
    return ISLANDS.slice(0, 3);
  }

  // Check if we are on a directed path
  if (DIRECTED_PATHS[current.id]) {
     const destIds = DIRECTED_PATHS[current.id];
     return destIds.map(id => ISLANDS.find(i => i.id === id)).filter(Boolean);
  }

  // Calculate distance to all other islands
  const destinations = ISLANDS
      .filter(i => i.id !== current.id)
      .map(i => {
        // Pythagorean theorem: a^2 + b^2 = c^2
        const dist = Math.sqrt(Math.pow(i.x - current.x, 2) + Math.pow(i.y - current.y, 2));
        return { ...i, distance: dist };
      });

  // Sort by shortest distance
  destinations.sort((a, b) => a.distance - b.distance);

  // Return the top 3 closest islands
  return destinations.slice(0, 3);
}

/**
 * Calculates travel distance/days to a specific island based on geometry.
 * @param {string} destinationId
 * @returns {number} Days to travel
 */
export function calculateTravelTime(destinationId) {
  const state = getState();
  const current = ISLANDS.find(i => i.id === state.currentIsland);
  const dest = ISLANDS.find(i => i.id === destinationId);

  if (!current || !dest) return 1;

  const dist = Math.sqrt(Math.pow(dest.x - current.x, 2) + Math.pow(dest.y - current.y, 2));

  // Roughly 1 day of travel per 5 units of map distance.
  return Math.max(1, Math.ceil(dist / 5));
}