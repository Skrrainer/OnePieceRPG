// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — config/enemies.js
//  Definitions for all enemies in the Intent-Driven Combat Node.
// ═══════════════════════════════════════════════════════════════════════════

export const ENEMIES = {
    MARINE_GRUNT: {
        id: 'MARINE_GRUNT',
        name: 'Marine Grunt',
        baseHp: 35,
        icon: '⚓',
        intents: [
            { type: 'attack', value: 8, label: 'Planning to slash for 8 DMG' },
            { type: 'defend', value: 5, label: 'Bracing for impact (5 Block)' },
            { type: 'attack', value: 12, label: 'Winding up a heavy strike (12 DMG)' }
        ]
    },
    CORRUPT_OFFICER: {
        id: 'CORRUPT_OFFICER',
        name: 'Corrupt Officer',
        baseHp: 65,
        icon: '🗡️',
        intents: [
            { type: 'attack', value: 15, label: 'Aiming flintlock (15 DMG)' },
            { type: 'buff', value: 0, label: 'Barking orders (+5 ATK next turn)' },
            { type: 'attack', value: 10, label: 'Quick slash (10 DMG)' }
        ]
    },
    LOCAL_THUG: {
        id: 'LOCAL_THUG',
        name: 'Local Thug',
        baseHp: 25,
        icon: '🔪',
        intents: [
            { type: 'attack', value: 6, label: 'Wild swing (6 DMG)' },
            { type: 'attack', value: 6, label: 'Wild swing (6 DMG)' },
            { type: 'defend', value: 3, label: 'Cowering (3 Block)' }
        ]
    }
};

/**
 * Helper to generate a fresh enemy instance for combat.
 */
export function spawnEnemy(enemyKey) {
    const template = ENEMIES[enemyKey];
    if (!template) return null;
    return {
        ...template,
        hp: template.baseHp,
        maxHp: template.baseHp,
        block: 0,
        currentIntentIndex: 0
    };
}