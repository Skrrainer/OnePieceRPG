// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — gameData.js
//  ALL static game constants live here. Tweak numbers freely.
// ═══════════════════════════════════════════════════════════════════════════

// ── Combat Styles ─────────────────────────────────────────────────────────
export const COMBAT_STYLES = {
  BRAWLER: {
    key: 'BRAWLER',
    label: 'Brawler',
    icon: '👊',
    cssClass: 'badge--brawler',
    statBonuses: { attack: 8, defense: 3, accuracy: 1 },
    startingItem: 'Iron Knuckles',
    description: 'Fearless in close combat. High attack, modest defense.',
    baseHP: 120,
    baseShipHP: 100,
  },
  SWORDSMAN: {
    key: 'SWORDSMAN',
    label: 'Swordsman',
    icon: '⚔️',
    cssClass: 'badge--swordsman',
    statBonuses: { attack: 5, defense: 5, accuracy: 4 },
    startingItem: 'Steel Cutlass',
    description: 'Balanced offense and precision. Adapts to any encounter.',
    baseHP: 100,
    baseShipHP: 100,
  },
  SNIPER: {
    key: 'SNIPER',
    label: 'Sniper',
    icon: '🎯',
    cssClass: 'badge--sniper',
    statBonuses: { attack: 3, defense: 2, accuracy: 10 },
    startingItem: 'Long-Range Flintlock',
    description: 'Strikes from the shadows. Unmatched accuracy, glass jaw.',
    baseHP: 80,
    baseShipHP: 100,
  },
};

// ── Seas of Origin ─────────────────────────────────────────────────────────
// RNG picks one at character creation — not chosen by the player.
export const SEAS = [
  {
    id: 'east_blue',
    label: 'East Blue',
    icon: '🌊',
    difficulty: 1,
    passiveModifiers: { attack: 1, defense: 1, accuracy: 0, goldMultiplier: 1.0 },
    lore: 'The weakest of the four seas, yet birthplace of legends.',
  },
  {
    id: 'west_blue',
    label: 'West Blue',
    icon: '🌊',
    difficulty: 1,
    passiveModifiers: { attack: 0, defense: 2, accuracy: 1, goldMultiplier: 1.05 },
    lore: 'A sea of scholars and swordsmen, riddled with hidden reefs.',
  },
  {
    id: 'north_blue',
    label: 'North Blue',
    icon: '🧊',
    difficulty: 2,
    passiveModifiers: { attack: 2, defense: 0, accuracy: 1, goldMultiplier: 1.1 },
    lore: 'Cold, treacherous waters breed the hardiest pirates.',
  },
  {
    id: 'south_blue',
    label: 'South Blue',
    icon: '☀️',
    difficulty: 2,
    passiveModifiers: { attack: 1, defense: 1, accuracy: 2, goldMultiplier: 1.1 },
    lore: 'Warm, deceptive currents hide the most cunning of pirates.',
  },
  {
    id: 'grand_line',
    label: 'Grand Line',
    icon: '⭐',
    difficulty: 3,
    passiveModifiers: { attack: 3, defense: 2, accuracy: 2, goldMultiplier: 1.25 },
    lore: 'Where the impossible becomes routine. Few survive adolescence.',
  },
  {
    id: 'new_world',
    label: 'New World',
    icon: '🔥',
    difficulty: 3,
    passiveModifiers: { attack: 4, defense: 3, accuracy: 3, goldMultiplier: 1.5 },
    lore: 'The second half of the Grand Line — only the elite dare tread here.',
  },
];

// ── Devil Fruits ───────────────────────────────────────────────────────────
// drop rates handled in rng.js; cssClass applied to <body> on consumption.
export const DEVIL_FRUITS = [
  {
    id: 'gomu_gomu',
    name: 'Gomu Gomu no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '🍈',
    ability: 'Your body becomes rubber. Bullets and blunt impacts deal reduced damage.',
    statMod: { attack: 2, defense: 5, accuracy: 0 },
    glowColor: '#ff6b6b',
  },
  {
    id: 'mera_mera',
    name: 'Mera Mera no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '🔥',
    ability: 'Control and become fire itself. Devastating ranged attacks.',
    statMod: { attack: 8, defense: 2, accuracy: 2 },
    glowColor: '#ff8c00',
  },
  {
    id: 'hie_hie',
    name: 'Hie Hie no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '❄️',
    ability: 'Become ice. Freeze enemies in their tracks and control the battlefield.',
    statMod: { attack: 5, defense: 5, accuracy: 2 },
    glowColor: '#a0d8ef',
  },
  {
    id: 'gura_gura',
    name: 'Gura Gura no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '💥',
    ability: 'The Tremor-Tremor Fruit. Create quakes powerful enough to destroy islands.',
    statMod: { attack: 10, defense: 0, accuracy: 0 },
    glowColor: '#9b7fd4',
  },
  {
    id: 'ope_ope',
    name: 'Ope Ope no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '⭕',
    ability: 'Create a surgical operating room. Rearrange anything within range.',
    statMod: { attack: 3, defense: 3, accuracy: 6 },
    glowColor: '#e0e0e0',
  },
  {
    id: 'yami_yami',
    name: 'Yami Yami no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '🌑',
    ability: 'The Darkness Fruit. Absorb and nullify all Devil Fruit powers.',
    statMod: { attack: 7, defense: -2, accuracy: 4 },
    glowColor: '#3d1f6e',
  },
  {
    id: 'tori_tori_phoenix',
    name: 'Tori Tori no Mi: Phoenix',
    type: 'Zoan',
    cssClass: 'df-zoan',
    icon: '🦅',
    ability: 'Transform into a mythical Phoenix. Regenerate HP at the start of each day.',
    statMod: { attack: 4, defense: 4, accuracy: 3, hpRegenPerDay: 10 },
    glowColor: '#4caf72',
  },
  {
    id: 'hana_hana',
    name: 'Hana Hana no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '🌸',
    ability: 'Bloom body parts on any surface. Perform multiple simultaneous strikes.',
    statMod: { attack: 3, defense: 2, accuracy: 7 },
    glowColor: '#ff9fc8',
  },
  {
    id: 'suna_suna',
    name: 'Suna Suna no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '🏜️',
    ability: 'Become and control sand. Drain moisture from enemies.',
    statMod: { attack: 6, defense: 3, accuracy: 2 },
    glowColor: '#d4a96a',
  },
  {
    id: 'niku_niku',
    name: 'Niku Niku no Mi',
    type: 'Zoan',
    cssClass: 'df-zoan',
    icon: '🐯',
    ability: 'Hybrid beast-human transformation. Enormous physical power boost.',
    statMod: { attack: 9, defense: 3, accuracy: -2 },
    glowColor: '#f4a223',
  },
];

// ── Drop Rates ─────────────────────────────────────────────────────────────
export const DROP_RATES = {
  DEVIL_FRUIT_CHANCE: 1,        // 2% per sail if no fruit already held
  RARE_EVENT_CHANCE: 1,         // 8% chance for a rare event variant
  CREW_RECRUIT_SUCCESS: 0.65,      // 65% success rate at Tavern recruitment
};

// ── Hub Services ───────────────────────────────────────────────────────────
export const HUB_SERVICES = {
  TAVERN: {
    REST_HP_RESTORE: 20,
    REST_COST: 0,
    RECRUIT_COST: 100,
    RUMOR_EVENTS: [
      'A Marine fleet was spotted near the reef — tread carefully.',
      'Traders speak of a chest washed ashore on the eastern isle.',
      'An old cook claims a Devil Fruit tree blooms once a year nearby.',
      'The harbormaster saw a ghost ship drifting south last night.',
      'A bounty hunter arrived this morning, asking questions.',
    ],
  },
  MARKET: {
    PROVISIONS_COST: 50,
    PROVISIONS_HP_BONUS: 30,
    CANNONBALL_COST: 30,
    CANNONBALL_ATTACK_BONUS: 2,
    CANNONBALL_USES: 3,
  },
  SHIPYARD: {
    REPAIR_COST_PER_HP: 5,          // Gold per missing ship HP
    UPGRADE_CANNON_COST: 200,
    UPGRADE_CANNON_ATTACK_BONUS: 5,
  },
};

// ── Starting Gold ──────────────────────────────────────────────────────────
export const STARTING_GOLD = 250;

// ── Event Types ────────────────────────────────────────────────────────────
export const EVENT_TYPES = {
  COMBAT:  'combat',
  LOOT:    'loot',
  STORY:   'story',
  WEATHER: 'weather',
};

// ── Fallback local events (used when Supabase is unavailable) ──────────────
export const LOCAL_EVENTS = [
  {
    id: 'local_01',
    sea_id: 'all',
    difficulty: 1,
    type: 'combat',
    title: 'Marine Patrol Vessel',
    description: 'A Marine sloop cuts across your bow, cannons primed. Fight or flee!',
    outcome_gold: -20,
    outcome_hp: -18,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_02',
    sea_id: 'all',
    difficulty: 1,
    type: 'loot',
    title: 'Floating Debris',
    description: 'A merchant\'s crates bob in the water — spoils from a recent storm.',
    outcome_gold: 60,
    outcome_hp: 0,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_03',
    sea_id: 'all',
    difficulty: 1,
    type: 'weather',
    title: 'Rogue Squall',
    description: 'Black clouds roll in with no warning. The hull groans as waves hammer the bow.',
    outcome_gold: 0,
    outcome_hp: -12,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_04',
    sea_id: 'all',
    difficulty: 2,
    type: 'story',
    title: 'Mysterious Castaway',
    description: 'A lone figure clings to a barrel — they offer intel about a hidden cove in exchange for passage.',
    outcome_gold: 40,
    outcome_hp: 0,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_05',
    sea_id: 'all',
    difficulty: 2,
    type: 'combat',
    title: 'Pirate Ambush',
    description: 'A rival crew emerges from fog, cannons blazing. No parley — only powder and steel.',
    outcome_gold: 80,
    outcome_hp: -30,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_06',
    sea_id: 'all',
    difficulty: 2,
    type: 'loot',
    title: 'Sunken Galleon',
    description: 'Your lookout spots a glint below the reef — an old war galleon with a cracked treasury.',
    outcome_gold: 150,
    outcome_hp: -5,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_07',
    sea_id: 'all',
    difficulty: 3,
    type: 'combat',
    title: 'Warlord\'s Vanguard',
    description: 'A fleet bearing a Warlord\'s crest bears down on you. Every hand to the cannons!',
    outcome_gold: 200,
    outcome_hp: -55,
    is_devil_fruit_drop: false,
  },
  {
    id: 'local_08',
    sea_id: 'all',
    difficulty: 1,
    type: 'loot',
    title: 'Rare Fruit Sighting',
    description: 'A gnarled tree on a passing isle bears a strangely swirling fruit...',
    outcome_gold: 0,
    outcome_hp: 0,
    is_devil_fruit_drop: true,
  },
];
