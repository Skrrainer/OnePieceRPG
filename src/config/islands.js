// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — config/islands.js
//  Dynamic Island Storage & Navigation Math. Populated from Supabase on boot.
// ═══════════════════════════════════════════════════════════════════════════

export const ISLANDS = [];

export function loadIslands(data) {
  ISLANDS.length = 0;
  if (data && Array.isArray(data)) {
    ISLANDS.push(...data);
  }
}

// ── Sea Zone Polygons ─────────────────────────────────────────────────────
// Each sea is defined by 4 corner points (x, y as % of map dimensions).
// Point-in-polygon uses ray casting (works for any simple polygon).

const SEA_ZONES = [
  {
    id: 'north_blue',
    polygon: [
      { x: 6.4,  y: 19   },
      { x: 25.8, y: 0.6  },
      { x: 44.7, y: 18.7 },
      { x: 24.5, y: 39.9 },
    ],
  },
  {
    id: 'east_blue',
    polygon: [
      { x: 52.7, y: 20.9 },
      { x: 75.4, y: 0.7  },
      { x: 95.3, y: 20.9 },
      { x: 75.2, y: 39.4 },
    ],
  },
  {
    id: 'south_blue',
    polygon: [
      { x: 73.8, y: 59.1 },
      { x: 52.6, y: 82.7 },
      { x: 73.4, y: 98.8 },
      { x: 95.5, y: 79.1 },
    ],
  },
  {
    id: 'west_blue',
    polygon: [
      { x: 24.1, y: 60.8 },
      { x: 5.2,  y: 81.3 },
      { x: 25.3, y: 99.3 },
      { x: 44.1, y: 81.6 },
    ],
  },
];

/**
 * Ray-casting point-in-polygon test.
 * @param {{ x: number, y: number }} point
 * @param {{ x: number, y: number }[]} polygon
 * @returns {boolean}
 */
function pointInPolygon(point, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Returns the sea ID for a given island based on its map coordinates.
 * Returns null if the island doesn't fall inside any named sea zone.
 * @param {{ x: number, y: number }} island
 * @returns {string|null}
 */
export function getSeaForIsland(island) {
  for (const zone of SEA_ZONES) {
    if (pointInPolygon({ x: island.x, y: island.y }, zone.polygon)) {
      return zone.id;
    }
  }
  return null;
}

// ── Spawn Island Selection ────────────────────────────────────────────────

/**
 * Returns a random island suitable for a new player to spawn on.
 * Only picks islands that fall inside one of the four named sea zones
 * (North Blue, East Blue, South Blue, West Blue).
 * Prefers SAFE/TRADE/MYSTERY types; falls back to any sea-zone island.
 * @returns {Object}
 */
export function pickSpawnIsland() {
  const inASeaZone = i => SEA_ZONES.some(zone => pointInPolygon({ x: i.x, y: i.y }, zone.polygon));
  const safeTypes  = ['SAFE', 'TRADE', 'MYSTERY', 'MARINE'];

  let candidates = ISLANDS.filter(i => inASeaZone(i) && safeTypes.includes(i.type));

  // Fallback: any island inside a sea zone, regardless of type
  if (candidates.length === 0) {
    candidates = ISLANDS.filter(inASeaZone);
  }

  // Ultimate Fallback just in case DB loading hiccupped
  if (candidates.length === 0 && ISLANDS.length > 0) {
    return ISLANDS[0];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}