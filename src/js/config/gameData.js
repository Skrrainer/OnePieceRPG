// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — config/gameData.js
//  Static D&D ruleset, class data, and game constants.
// ═══════════════════════════════════════════════════════════════════════════

export const CLASSES = {
  CAPTAIN: {
    id: 'CAPTAIN', label: 'Captain', icon: '🏴‍☠️', hitDie: 10,
    description: 'Leads from the front. High Charisma and Strength.',
    baseAttributes: { str: 14, dex: 10, con: 12, int: 8, wis: 10, cha: 16 },
    proficiencies: ['str', 'cha'],
    startingEquipment: ['Cutlass', 'Captain\'s Coat'],
    skillTree: [
      { id: 'cap_1', name: 'Commanding Strike', desc: 'A fierce attack dealing 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'cap_2', name: 'Rallying Cry', desc: 'Heals yourself or an ally for 1d8 + CHA Modifier.', levelReq: 3, type: 'heal', healDice: '1d8', stat: 'cha' }
    ]
  },
  SWORDSMAN: {
    id: 'SWORDSMAN', label: 'Swordsman', icon: '⚔️', hitDie: 10,
    description: 'A master of blades. High Strength and Dexterity.',
    baseAttributes: { str: 16, dex: 14, con: 12, int: 8, wis: 10, cha: 10 },
    proficiencies: ['str', 'dex'],
    startingEquipment: ['Katana', 'Bandana'],
    skillTree: [
      { id: 'swd_1', name: 'Cross Slash', desc: 'A multi-blade strike dealing 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'swd_2', name: 'Blade Parry', desc: 'An intimidating defensive stance granting +5 AC for the turn.', levelReq: 3, type: 'buff', amount: 5 }
    ]
  },
  ARCHAEOLOGIST: {
    id: 'ARCHAEOLOGIST', label: 'Archaeologist', icon: '📖', hitDie: 8,
    description: 'A scholar of history. High Intelligence and Wisdom.',
    baseAttributes: { str: 8, dex: 12, con: 10, int: 16, wis: 14, cha: 10 },
    proficiencies: ['int', 'wis'],
    startingEquipment: ['Historical Log', 'Light Jacket'],
    skillTree: [
      { id: 'arc_1', name: 'Expose Weakness', desc: 'Exploits structural flaws in armor, dealing 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'arc_2', name: 'Tactical Advice', desc: 'Calls out incoming attacks, granting +4 AC to the crew.', levelReq: 3, type: 'buff', amount: 4 }
    ]
  },
  NAVIGATOR: {
    id: 'NAVIGATOR', label: 'Navigator', icon: '🧭', hitDie: 8,
    description: 'Reads the weather and the waves. High Intelligence and Wisdom.',
    baseAttributes: { str: 8, dex: 12, con: 10, int: 16, wis: 14, cha: 10 },
    proficiencies: ['int', 'wis'],
    startingEquipment: ['Spyglass', 'Sextant'],
    skillTree: [
      { id: 'nav_1', name: 'Squall Strike', desc: 'Uses the environment to land a heavy blow (1.5x DMG).', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'nav_2', name: 'Read the Wind', desc: 'Predicts enemy movements, granting +5 AC for the turn.', levelReq: 3, type: 'buff', amount: 5 }
    ]
  },
  SNIPER: {
    id: 'SNIPER', label: 'Sniper', icon: '🎯', hitDie: 8,
    description: 'Unmatched ranged accuracy and trap detection. High Dexterity.',
    baseAttributes: { str: 8, dex: 16, con: 10, int: 12, wis: 14, cha: 10 },
    proficiencies: ['dex', 'int'],
    startingEquipment: ['Flintlock', 'Goggles'],
    skillTree: [
      { id: 'sni_1', name: 'Vital Shot', desc: 'A precision shot dealing 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'sni_2', name: 'Smoke Pellet', desc: 'Fires a smoke pellet, granting +4 AC to the crew.', levelReq: 3, type: 'buff', amount: 4 }
    ]
  },
  SHIPWRIGHT: {
    id: 'SHIPWRIGHT', label: 'Shipwright', icon: '🔨', hitDie: 10,
    description: 'Masters of timber and iron. High Strength and Intelligence.',
    baseAttributes: { str: 16, dex: 10, con: 14, int: 14, wis: 8, cha: 8 },
    proficiencies: ['str', 'int'],
    startingEquipment: ['Heavy Hammer', 'Toolbelt'],
    skillTree: [
      { id: 'shp_1', name: 'Heavy Smash', desc: 'A brutal slam dealing 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'shp_2', name: 'Jury Rig', desc: 'Throws up a makeshift barricade, granting +6 AC for the turn.', levelReq: 3, type: 'buff', amount: 6 }
    ]
  },
  COOK: {
    id: 'COOK', label: 'Cook', icon: '🍳', hitDie: 8,
    description: 'The crew\'s lifeline. High Constitution and Dexterity.',
    baseAttributes: { str: 12, dex: 14, con: 16, int: 10, wis: 10, cha: 8 },
    proficiencies: ['con', 'dex'],
    startingEquipment: ['Chef\'s Knife', 'Spices'],
    skillTree: [
      { id: 'cok_1', name: 'Butcher\'s Cut', desc: 'A precise carving strike dealing 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'cok_2', name: 'Vitality Meal', desc: 'Force-feeds a quick meal healing 1d10 + CON Modifier.', levelReq: 3, type: 'heal', healDice: '1d10', stat: 'con' }
    ]
  },
  DOCTOR: {
    id: 'DOCTOR', label: 'Doctor', icon: '⚕️', hitDie: 8,
    description: 'Keeps the crew breathing. High Wisdom and Intelligence.',
    baseAttributes: { str: 8, dex: 10, con: 12, int: 14, wis: 16, cha: 10 },
    proficiencies: ['wis', 'int'],
    startingEquipment: ['Medical Kit', 'Scalpel'],
    skillTree: [
      { id: 'doc_1', name: 'Surgical Strike', desc: 'Hits a vital nerve for 1.5x Weapon DMG.', levelReq: 1, type: 'attack', mult: 1.5 },
      { id: 'doc_2', name: 'Field Medicine', desc: 'Applies first aid healing 2d6 + WIS Modifier.', levelReq: 3, type: 'heal', healDice: '2d6', stat: 'wis' }
    ]
  }
};

export const LEVEL_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];

export function getProficiencyBonus(level) {
  return Math.ceil(1 + (level / 4));
}

export const SEAS = [
  { id: 'east_blue', label: 'East Blue', icon: '🌊', difficulty: 1, lore: 'The weakest of the four seas, yet birthplace of legends.' },
  { id: 'west_blue', label: 'West Blue', icon: '🌊', difficulty: 1, lore: 'A sea of scholars and swordsmen.' },
  { id: 'north_blue', label: 'North Blue', icon: '🧊', difficulty: 2, lore: 'Cold, treacherous waters breed the hardiest pirates.' },
  { id: 'south_blue', label: 'South Blue', icon: '☀️', difficulty: 2, lore: 'Warm, deceptive currents hide cunning pirates.' },
  { id: 'grand_line', label: 'Grand Line', icon: '⭐', difficulty: 3, lore: 'Where the impossible becomes routine.' },
  { id: 'new_world', label: 'New World', icon: '🔥', difficulty: 4, lore: 'The second half of the Grand Line.' }
];

export const DEVIL_FRUITS = [
  {
    id: 'gomu_gomu', name: 'Gomu Gomu no Mi', type: 'Paramecia', cssClass: 'df-paramecia', icon: '🍈',
    ability: 'Your body becomes rubber. Gain resistance to bludgeoning damage.', attributeBuffs: { con: 2, dex: 1 }, glowColor: '#ff6b6b',
    skills: [
      { id: 'df_gomu_1', name: 'Rubber Pistol', desc: 'A stretching strike dealing 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_gomu_2', name: 'Balloon Defense', desc: 'Inflate to bounce back attacks, granting +5 AC.', type: 'buff', amount: 5 }
    ]
  },
  {
    id: 'mera_mera', name: 'Mera Mera no Mi', type: 'Logia', cssClass: 'df-logia', icon: '🔥',
    ability: 'Become fire. Attacks deal extra fire damage (1d6).', attributeBuffs: { cha: 2, dex: 1 }, glowColor: '#ff8c00',
    skills: [
      { id: 'df_mera_1', name: 'Fire Fist', desc: 'A massive column of flame dealing 2x DMG.', type: 'attack', mult: 2.0 },
      { id: 'df_mera_2', name: 'Flame Pillar', desc: 'Surround yourself in fire, granting +4 AC.', type: 'buff', amount: 4 }
    ]
  },
  {
    id: 'hie_hie', name: 'Hie Hie no Mi', type: 'Logia', cssClass: 'df-logia', icon: '❄️',
    ability: 'Become ice. Freeze enemies in their tracks and control the battlefield.', attributeBuffs: { int: 2, con: 1 }, glowColor: '#a0d8ef',
    skills: [
      { id: 'df_hie_1', name: 'Ice Partisan', desc: 'Hurls spears of ice dealing 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_hie_2', name: 'Flash Freeze', desc: 'Freezes the immediate area, granting +6 AC.', type: 'buff', amount: 6 }
    ]
  },
  {
    id: 'gura_gura', name: 'Gura Gura no Mi', type: 'Paramecia', cssClass: 'df-paramecia', icon: '💥',
    ability: 'The Tremor-Tremor Fruit. Create quakes powerful enough to destroy islands.', attributeBuffs: { str: 3 }, glowColor: '#9b7fd4',
    skills: [
      { id: 'df_gura_1', name: 'Quake Smash', desc: 'Shatters the air, dealing 2x DMG.', type: 'attack', mult: 2.0 }
    ]
  },
  {
    id: 'ope_ope', name: 'Ope Ope no Mi', type: 'Paramecia', cssClass: 'df-paramecia', icon: '⭕',
    ability: 'Create a surgical operating room. Rearrange anything within range.', attributeBuffs: { int: 2, wis: 1 }, glowColor: '#e0e0e0',
    skills: [
      { id: 'df_ope_1', name: 'Room: Amputate', desc: 'Slices through space, dealing 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_ope_2', name: 'Room: Shambles', desc: 'Swaps places with objects, granting +5 AC.', type: 'buff', amount: 5 }
    ]
  },
  {
    id: 'yami_yami', name: 'Yami Yami no Mi', type: 'Logia', cssClass: 'df-logia', icon: '🌑',
    ability: 'The Darkness Fruit. Absorb and nullify all Devil Fruit powers.', attributeBuffs: { con: 3 }, glowColor: '#3d1f6e',
    skills: [
      { id: 'df_yami_1', name: 'Black Hole', desc: 'Crushes the target with gravity, dealing 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_yami_2', name: 'Dark Vortex', desc: 'Absorbs incoming blows, granting +5 AC.', type: 'buff', amount: 5 }
    ]
  },
  {
    id: 'tori_tori_phoenix', name: 'Tori Tori no Mi: Phoenix', type: 'Zoan', cssClass: 'df-zoan', icon: '🦅',
    ability: 'Transform into a mythical Phoenix. Regenerate HP at the start of each day.', attributeBuffs: { wis: 2, con: 1 }, glowColor: '#4caf72',
    skills: [
      { id: 'df_tori_1', name: 'Phoenix Brand', desc: 'Strikes with blue flames for 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_tori_2', name: 'Regeneration', desc: 'Bathes in flames to heal 2d8 + WIS.', type: 'heal', healDice: '2d8', stat: 'wis' }
    ]
  },
  {
    id: 'hana_hana', name: 'Hana Hana no Mi', type: 'Paramecia', cssClass: 'df-paramecia', icon: '🌸',
    ability: 'Bloom body parts on any surface. Perform multiple simultaneous strikes.', attributeBuffs: { dex: 2, int: 1 }, glowColor: '#ff9fc8',
    skills: [
      { id: 'df_hana_1', name: 'Clutch', desc: 'Sprouts arms to snap joints, dealing 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_hana_2', name: 'Sprouting Net', desc: 'Creates a net of arms, granting +4 AC.', type: 'buff', amount: 4 }
    ]
  },
  {
    id: 'suna_suna', name: 'Suna Suna no Mi', type: 'Logia', cssClass: 'df-logia', icon: '🏜️',
    ability: 'Become and control sand. Drain moisture from enemies.', attributeBuffs: { wis: 2, dex: 1 }, glowColor: '#d4a96a',
    skills: [
      { id: 'df_suna_1', name: 'Desert Spada', desc: 'A cutting blade of sand dealing 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_suna_2', name: 'Sandstorm', desc: 'Kicks up a blinding storm, granting +5 AC.', type: 'buff', amount: 5 }
    ]
  },
  {
    id: 'niku_niku', name: 'Niku Niku no Mi', type: 'Zoan', cssClass: 'df-zoan', icon: '🐯',
    ability: 'Hybrid beast-human transformation. Enormous physical power boost.', attributeBuffs: { str: 2, con: 1 }, glowColor: '#f4a223',
    skills: [
      { id: 'df_niku_1', name: 'Pad Cannon', desc: 'Fires compressed air for 1.5x DMG.', type: 'attack', mult: 1.5 },
      { id: 'df_niku_2', name: 'Ursus Shock', desc: 'A massive shockwave dealing 2.0x DMG.', type: 'attack', mult: 2.0 }
    ]
  },
];

export const DROP_RATES = { DEVIL_FRUIT_CHANCE: 0.02, RARE_EVENT_CHANCE: 0.02, CREW_RECRUIT_SUCCESS: 0.65 };

export const HUB_SERVICES = {
  TAVERN: {
    REST_HP_RESTORE: 20, REST_COST: 0, RECRUIT_COST: 100,
    RUMOR_EVENTS: [
      'A Marine fleet was spotted near the reef — tread carefully.',
      'Traders speak of a chest washed ashore on the eastern isle.',
      'An old cook claims a Devil Fruit tree blooms once a year nearby.',
      'The harbormaster saw a ghost ship drifting south last night.',
      'A bounty hunter arrived this morning, asking questions.',
    ],
  },
  MARKET: { PROVISIONS_COST: 50, PROVISIONS_HP_BONUS: 30, CANNONBALL_COST: 30, CANNONBALL_ATTACK_BONUS: 2, CANNONBALL_USES: 3 },
  SHIPYARD: { REPAIR_COST_PER_HP: 5, UPGRADE_CANNON_COST: 200, UPGRADE_CANNON_ATTACK_BONUS: 5 },
};

export const STARTING_GOLD = 250;

export const EVENT_TYPES = { COMBAT: 'combat', LOOT: 'loot', STORY: 'story', WEATHER: 'weather' };

export const LOCAL_EVENTS = [
  { id: 'local_01', sea_id: 'all', difficulty: 1, type: 'combat', title: 'Marine Patrol Vessel', description: 'A Marine sloop cuts across your bow, cannons primed. Fight or flee!', outcome_gold: -20, outcome_hp: -18, is_devil_fruit_drop: false },
  { id: 'local_02', sea_id: 'all', difficulty: 1, type: 'loot', title: 'Floating Debris', description: 'A merchant\'s crates bob in the water — spoils from a recent storm.', outcome_gold: 60, outcome_hp: 0, is_devil_fruit_drop: false },
  { id: 'local_03', sea_id: 'all', difficulty: 1, type: 'weather', title: 'Rogue Squall', description: 'Black clouds roll in with no warning. The hull groans as waves hammer the bow.', outcome_gold: 0, outcome_hp: -12, is_devil_fruit_drop: false },
  { id: 'local_04', sea_id: 'all', difficulty: 2, type: 'story', title: 'Mysterious Castaway', description: 'A lone figure clings to a barrel — they offer intel about a hidden cove in exchange for passage.', outcome_gold: 40, outcome_hp: 0, is_devil_fruit_drop: false },
  { id: 'local_05', sea_id: 'all', difficulty: 2, type: 'combat', title: 'Pirate Ambush', description: 'A rival crew emerges from fog, cannons blazing. No parley — only powder and steel.', outcome_gold: 80, outcome_hp: -30, is_devil_fruit_drop: false },
  { id: 'local_06', sea_id: 'all', difficulty: 2, type: 'loot', title: 'Sunken Galleon', description: 'Your lookout spots a glint below the reef — an old war galleon with a cracked treasury.', outcome_gold: 150, outcome_hp: -5, is_devil_fruit_drop: false },
  { id: 'local_07', sea_id: 'all', difficulty: 3, type: 'combat', title: 'Warlord\'s Vanguard', description: 'A fleet bearing a Warlord\'s crest bears down on you. Every hand to the cannons!', outcome_gold: 200, outcome_hp: -55, is_devil_fruit_drop: false },
  { id: 'local_08', sea_id: 'all', difficulty: 1, type: 'loot', title: 'Rare Fruit Sighting', description: 'A gnarled tree on a passing isle bears a strangely swirling fruit...', outcome_gold: 0, outcome_hp: 0, is_devil_fruit_drop: true },
];