// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/crewState.js
//  In-memory cache of the player's recruited crew, loaded from Supabase.
//  Crew stats are defined in the crew_roster table — edit them there.
// ═══════════════════════════════════════════════════════════════════════════

/** @type {Array} */
let _crew = [];

/** Replace the full crew list (called on game load). */
export function setCrew(members) {
  _crew = Array.isArray(members) ? [...members] : [];
}

/** Add one member to the local cache after recruiting. */
export function addToCrewCache(member) {
  _crew.push(member);
}

/** Returns a shallow copy of the crew array. */
export function getCrew() {
  return [..._crew];
}
