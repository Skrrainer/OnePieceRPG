// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — gameData.js
//  Static D&D ruleset, class data, and game constants.
// ═══════════════════════════════════════════════════════════════════════════

// ── Ship Roles (Classes) ──────────────────────────────────────────────────
export const CLASSES = {
  CAPTAIN: {
    id: 'CAPTAIN',
    label: 'Captain',
    icon: '🏴‍☠️',
    description: 'Leads from the front. High Charisma and Strength. Buffs crew morale.',
    hitDie: 10,
    baseAttributes: { str: 14, dex: 10, con: 12, int: 8, wis: 10, cha: 16 },
    proficiencies: ['str', 'cha'],
    startingEquipment: ['Cutlass', 'Captain\'s Coat'],
  },
  NAVIGATOR: {
    id: 'NAVIGATOR',
    label: 'Navigator',
    icon: '🧭',
    description: 'Reads the weather and the waves. High Intelligence and Wisdom.',
    hitDie: 8,
    baseAttributes: { str: 8, dex: 12, con: 10, int: 16, wis: 14, cha: 10 },
    proficiencies: ['int', 'wis'],
    startingEquipment: ['Clima-Tact', 'Sextant'],
  },
  SNIPER: {
    id: 'SNIPER',
    label: 'Sniper',
    icon: '🎯',
    description: 'Unmatched ranged accuracy and trap detection. High Dexterity.',
    hitDie: 8,
    baseAttributes: { str: 8, dex: 16, con: 10, int: 12, wis: 14, cha: 10 },
    proficiencies: ['dex', 'int'],
    startingEquipment: ['Kabuto', 'Goggles'],
  },
  SHIPWRIGHT: {
    id: 'SHIPWRIGHT',
    label: 'Shipwright',
    icon: '🔨',
    description: 'Masters of timber and iron. High Strength and Intelligence.',
    hitDie: 10,
    baseAttributes: { str: 16, dex: 10, con: 14, int: 14, wis: 8, cha: 8 },
    proficiencies: ['str', 'int'],
    startingEquipment: ['Heavy Hammer', 'Toolbelt'],
  },
  COOK: {
    id: 'COOK',
    label: 'Cook',
    icon: '🍳',
    description: 'The crew\'s lifeline. High Constitution and Dexterity.',
    hitDie: 8,
    baseAttributes: { str: 12, dex: 14, con: 16, int: 10, wis: 10, cha: 8 },
    proficiencies: ['con', 'dex'],
    startingEquipment: ['Chef\'s Knife', 'Spices'],
  },
  DOCTOR: {
    id: 'DOCTOR',
    label: 'Doctor',
    icon: '⚕️',
    description: 'Keeps the crew breathing. High Wisdom and Intelligence.',
    hitDie: 8,
    baseAttributes: { str: 8, dex: 10, con: 12, int: 14, wis: 16, cha: 10 },
    proficiencies: ['wis', 'int'],
    startingEquipment: ['Medical Kit', 'Scalpel'],
  }
};

// ── Level Progression ─────────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  300,    // Level 2
  900,    // Level 3
  2700,   // Level 4
  6500,   // Level 5
  14000,  // Level 6
  23000,  // Level 7
  34000,  // Level 8
  48000,  // Level 9
  64000   // Level 10
];

// Returns the proficiency bonus based on standard D&D scaling
export function getProficiencyBonus(level) {
  return Math.ceil(1 + (level / 4));
}

// ── Seas of Origin ────────────────────────────────────────────────────────
export const SEAS = [
  { id: 'east_blue', label: 'East Blue', icon: '🌊', difficulty: 1, lore: 'The weakest of the four seas, yet birthplace of legends.' },
  { id: 'west_blue', label: 'West Blue', icon: '🌊', difficulty: 1, lore: 'A sea of scholars and swordsmen.' },
  { id: 'north_blue', label: 'North Blue', icon: '🧊', difficulty: 2, lore: 'Cold, treacherous waters breed the hardiest pirates.' },
  { id: 'south_blue', label: 'South Blue', icon: '☀️', difficulty: 2, lore: 'Warm, deceptive currents hide cunning pirates.' },
  { id: 'grand_line', label: 'Grand Line', icon: '⭐', difficulty: 3, lore: 'Where the impossible becomes routine.' },
  { id: 'new_world', label: 'New World', icon: '🔥', difficulty: 4, lore: 'The second half of the Grand Line.' }
];

// ── Devil Fruits ──────────────────────────────────────────────────────────
export const DEVIL_FRUITS = [
  {
    id: 'gomu_gomu',
    name: 'Gomu Gomu no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '🍈',
    ability: 'Your body becomes rubber. Gain resistance to bludgeoning damage.',
    attributeBuffs: { con: 2, dex: 1 },
    glowColor: '#ff6b6b',
  },
  {
    id: 'mera_mera',
    name: 'Mera Mera no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '🔥',
    ability: 'Become fire. Attacks deal extra fire damage (1d6).',
    attributeBuffs: { cha: 2, dex: 1 },
    glowColor: '#ff8c00',
  },
  {
    id: 'hie_hie',
    name: 'Hie Hie no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '❄️',
    ability: 'Become ice. Freeze enemies in their tracks and control the battlefield.',
    attributeBuffs: { int: 2, con: 1 },
    glowColor: '#a0d8ef',
  },
  {
    id: 'gura_gura',
    name: 'Gura Gura no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '💥',
    ability: 'The Tremor-Tremor Fruit. Create quakes powerful enough to destroy islands.',
    attributeBuffs: { str: 3 },
    glowColor: '#9b7fd4',
  },
  {
    id: 'ope_ope',
    name: 'Ope Ope no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '⭕',
    ability: 'Create a surgical operating room. Rearrange anything within range.',
    attributeBuffs: { int: 2, wis: 1 },
    glowColor: '#e0e0e0',
  },
  {
    id: 'yami_yami',
    name: 'Yami Yami no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '🌑',
    ability: 'The Darkness Fruit. Absorb and nullify all Devil Fruit powers.',
    attributeBuffs: { con: 3 },
    glowColor: '#3d1f6e',
  },
  {
    id: 'tori_tori_phoenix',
    name: 'Tori Tori no Mi: Phoenix',
    type: 'Zoan',
    cssClass: 'df-zoan',
    icon: '🦅',
    ability: 'Transform into a mythical Phoenix. Regenerate HP at the start of each day.',
    attributeBuffs: { wis: 2, con: 1 },
    glowColor: '#4caf72',
  },
  {
    id: 'hana_hana',
    name: 'Hana Hana no Mi',
    type: 'Paramecia',
    cssClass: 'df-paramecia',
    icon: '🌸',
    ability: 'Bloom body parts on any surface. Perform multiple simultaneous strikes.',
    attributeBuffs: { dex: 2, int: 1 },
    glowColor: '#ff9fc8',
  },
  {
    id: 'suna_suna',
    name: 'Suna Suna no Mi',
    type: 'Logia',
    cssClass: 'df-logia',
    icon: '🏜️',
    ability: 'Become and control sand. Drain moisture from enemies.',
    attributeBuffs: { wis: 2, dex: 1 },
    glowColor: '#d4a96a',
  },
  {
    id: 'niku_niku',
    name: 'Niku Niku no Mi',
    type: 'Zoan',
    cssClass: 'df-zoan',
    icon: '🐯',
    ability: 'Hybrid beast-human transformation. Enormous physical power boost.',
    attributeBuffs: { str: 2, con: 1 },
    glowColor: '#f4a223',
  },
];

// ── Drop Rates ─────────────────────────────────────────────────────────────
export const DROP_RATES = {
  DEVIL_FRUIT_CHANCE: 0.02,        // 2% per sail if no fruit already held
  RARE_EVENT_CHANCE: 0.02,         // 8% chance for a rare event variant
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