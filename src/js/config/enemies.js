// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — config/enemies.js
//  Definitions for all enemies and escalating Quest Bosses.
// ═══════════════════════════════════════════════════════════════════════════

export const ENEMIES = {
    // ── Standard Mobs ──
    MARINE_GRUNT: {
        id: 'MARINE_GRUNT', name: 'Marine Grunt', baseHp: 15, ac: 12, icon: '⚓',
        intents: [
            { type: 'attack', value: 4, label: 'Standard slash (1d6 + 1 DMG)' },
            { type: 'defend', value: 3, label: 'Bracing for impact (3 Block)' },
            { type: 'attack', value: 6, label: 'Heavy strike (1d8 + 2 DMG)' }
        ]
    },
    CORRUPT_OFFICER: {
        id: 'CORRUPT_OFFICER', name: 'Corrupt Officer', baseHp: 28, ac: 14, icon: '🗡️',
        intents: [
            { type: 'attack', value: 7, label: 'Flintlock shot (1d10 + 2 DMG)' },
            { type: 'defend', value: 5, label: 'Barking orders (5 Block)' },
            { type: 'attack', value: 5, label: 'Quick slash (1d6 + 2 DMG)' }
        ]
    },
    LOCAL_THUG: {
        id: 'LOCAL_THUG', name: 'Local Thug', baseHp: 10, ac: 11, icon: '🔪',
        intents: [
            { type: 'attack', value: 3, label: 'Wild swing (1d4 + 1 DMG)' },
            { type: 'defend', value: 2, label: 'Cowering (2 Block)' }
        ]
    },
    BOUNTY_HUNTER: {
        id: 'BOUNTY_HUNTER', name: 'Bounty Hunter', baseHp: 42, ac: 15, icon: '🎯',
        intents: [
            { type: 'attack', value: 10, label: 'Fatal shot (1d12 + 4 DMG)' },
            { type: 'attack', value: 6, label: 'Quick draw (1d8 + 2 DMG)' },
            { type: 'defend', value: 6, label: 'Taking cover (6 Block)' }
        ]
    },

    // ── Quest Bosses (Escalating Tiers) ──
    ALVIDA_GRUNT: { // Tier 1
        id: 'ALVIDA_GRUNT', name: 'Iron-Jaw Grunt', baseHp: 35, ac: 13, icon: '🪓',
        intents: [
            { type: 'attack', value: 8, label: 'Heavy Mace Swing (1d10 + 3 DMG)' },
            { type: 'defend', value: 4, label: 'Iron Guard (4 Block)' },
            { type: 'attack', value: 12, label: 'Crushing Blow (1d12 + 4 DMG)' }
        ]
    },
    AXE_HAND: { // Tier 1
        id: 'AXE_HAND', name: 'Captain Morgan', baseHp: 45, ac: 14, icon: '🪓',
        intents: [
            { type: 'attack', value: 10, label: 'Guillotine Chop (1d12 + 4 DMG)' },
            { type: 'attack', value: 6, label: 'Backhand Strike (1d8 + 2 DMG)' },
            { type: 'defend', value: 5, label: 'Commanding Stance (5 Block)' }
        ]
    },
    BUGGY: { // Tier 2
        id: 'BUGGY', name: 'Buggy the Clown', baseHp: 65, ac: 14, icon: '🤡',
        intents: [
            { type: 'attack', value: 12, label: 'Chop-Chop Cannon (2d6 + 5 DMG)' },
            { type: 'defend', value: 8, label: 'Split Guard (8 Block)' },
            { type: 'attack', value: 8, label: 'Flying Daggers (1d8 + 4 DMG)' }
        ]
    },
    KURO: { // Tier 2
        id: 'KURO', name: 'Captain Kuro', baseHp: 85, ac: 16, icon: '🐾',
        intents: [
            { type: 'attack', value: 16, label: 'Out of the Bag Attack (3d4 + 4 DMG)' },
            { type: 'attack', value: 10, label: 'Silent Step Slash (1d10 + 5 DMG)' },
            { type: 'defend', value: 5, label: 'Shadow Meld (5 Block)' }
        ]
    },
    ARLONG: { // Tier 3
        id: 'ARLONG', name: 'Arlong', baseHp: 120, ac: 16, icon: '🦈',
        intents: [
            { type: 'attack', value: 20, label: 'Shark on Darts (2d10 + 6 DMG)' },
            { type: 'attack', value: 14, label: 'Tooth Attack (1d12 + 5 DMG)' },
            { type: 'defend', value: 10, label: 'Fish-Man Resilience (10 Block)' }
        ]
    },
    SMOKER: { // Tier 3
        id: 'SMOKER', name: 'Captain Smoker', baseHp: 150, ac: 18, icon: '🚬',
        intents: [
            { type: 'attack', value: 18, label: 'White Blow (2d8 + 6 DMG)' },
            { type: 'defend', value: 12, label: 'Smoke Screen (12 Block)' },
            { type: 'attack', value: 22, label: 'Jutte Strike (1d12 + 8 DMG)' }
        ]
    },
    CROCODILE: { // Tier 4
        id: 'CROCODILE', name: 'Sir Crocodile', baseHp: 220, ac: 18, icon: '🐊',
        intents: [
            { type: 'attack', value: 30, label: 'Desert Spada (3d10 + 8 DMG)' },
            { type: 'attack', value: 25, label: 'Sables (2d12 + 6 DMG)' },
            { type: 'defend', value: 15, label: 'Sand Armor (15 Block)' }
        ]
    }
};

export const ENCOUNTERS = {
    // ── Random Nodes ──
    EASY_PATROL: ['MARINE_GRUNT', 'MARINE_GRUNT'],
    THUG_GANG: ['LOCAL_THUG', 'LOCAL_THUG', 'LOCAL_THUG'],
    OFFICER_SQUAD: ['CORRUPT_OFFICER', 'MARINE_GRUNT', 'MARINE_GRUNT'],
    BOSS_HUNTER: ['BOUNTY_HUNTER', 'LOCAL_THUG'],

    // ── Quest Showdowns (Legacy config support) ──
    QUEST_ALVIDA: ['ALVIDA_GRUNT', 'LOCAL_THUG'],
    QUEST_MORGAN: ['AXE_HAND', 'MARINE_GRUNT', 'MARINE_GRUNT'],
    QUEST_BUGGY: ['BUGGY', 'LOCAL_THUG', 'LOCAL_THUG'],
    QUEST_KURO: ['KURO', 'CORRUPT_OFFICER'],
    QUEST_ARLONG: ['ARLONG', 'LOCAL_THUG', 'LOCAL_THUG'],
    QUEST_SMOKER: ['SMOKER', 'MARINE_GRUNT', 'MARINE_GRUNT', 'MARINE_GRUNT'],
    QUEST_CROCODILE: ['CROCODILE', 'BOUNTY_HUNTER', 'BOUNTY_HUNTER'],

    // ── Quest Showdowns (Database support) ──
    BOSS_MORGAN: ['AXE_HAND', 'MARINE_GRUNT', 'MARINE_GRUNT'],
    BOSS_BUGGY: ['BUGGY', 'LOCAL_THUG', 'LOCAL_THUG'],
    BOSS_ARLONG: ['ARLONG', 'LOCAL_THUG', 'LOCAL_THUG']
};

export function spawnEnemy(enemyKey, index) {
    const template = ENEMIES[enemyKey];
    if (!template) return null;
    return {
        ...template,
        uid: `${enemyKey}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        hp: template.baseHp,
        maxHp: template.baseHp,
        block: 0,
        currentIntentIndex: 0,
        targetUid: null
    };
}