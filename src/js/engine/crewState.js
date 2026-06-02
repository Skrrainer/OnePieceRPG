// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/crewState.js
//  In-memory cache of the player's recruited crew, loaded from Supabase.
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

/** Modifies a specific crew member's HP and clamps it to their maximum. */
export function modifyCrewHp(crewId, delta) {
  const member = _crew.find(c => c.id === crewId);
  if (member) {
    member.hp = Math.max(0, Math.min(member.max_hp || 100, member.hp + delta));
    return member.hp;
  }
  return 0;
}