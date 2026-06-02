// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — config/quests.js
//  Centralized registry for all dynamic, multi-stage quests.
// ═══════════════════════════════════════════════════════════════════════════

export const QUESTS = [
    // ── TIER 1 (Levels 1-2) ───────────────────────────────────────────────────
    {
        id: 'alvida_grunt',
        tier: 1,
        name: 'The Iron-Jaw Outpost',
        reward: { gold: 300, exp: 100 },
        encounterKey: 'QUEST_ALVIDA',
        stages: [
            {
                phaseName: 'Phase 1: Investigation',
                text: 'You enter the crowded port tavern searching for the target\'s coordinates.',
                choices: [
                    { label: 'Interrogate Bartender', stat: 'int', dc: 12 },
                    { label: 'Eavesdrop on Patron', stat: 'cha', dc: 11 }
                ]
            },
            {
                phaseName: 'Phase 2: The Chase',
                text: 'The target spotted you! They leap window-first out of the building into the back alleys.',
                choices: [
                    { label: 'Parkour over roofs', stat: 'dex', dc: 13 },
                    { label: 'Smash through doors', stat: 'str', dc: 12 }
                ]
            }
        ],
        bossText: 'Cornered at the dead end, the heavy-mace wielding pirate laughs and takes a swing at your head.'
    },
    {
        id: 'axe_hand_tyrant',
        tier: 1,
        name: 'The Tyrant\'s Statue',
        reward: { gold: 450, exp: 150 },
        encounterKey: 'QUEST_MORGAN',
        stages: [
            {
                phaseName: 'Phase 1: Infiltration',
                text: 'The Marine base is heavily guarded. You need a way inside the courtyard.',
                choices: [
                    { label: 'Scale the sheer stone wall', stat: 'str', dc: 13 },
                    { label: 'Pick the rusted sewer grate', stat: 'dex', dc: 12 }
                ]
            },
            {
                phaseName: 'Phase 2: The Prisoners',
                text: 'You find bound prisoners who know the Captain\'s weakness, but a guard is approaching.',
                choices: [
                    { label: 'Hide in the shadows', stat: 'dex', dc: 14 },
                    { label: 'Bluff the guard', stat: 'cha', dc: 13 }
                ]
            }
        ],
        bossText: 'A massive Marine Captain with a prosthetic axe for a hand leaps from the rooftop, shattering the ground before you.'
    },

    // ── TIER 2 (Levels 3-4) ───────────────────────────────────────────────────
    {
        id: 'flashy_clown',
        tier: 2,
        name: 'The Flashy Carnival',
        reward: { gold: 800, exp: 300 },
        encounterKey: 'QUEST_BUGGY',
        stages: [
            {
                phaseName: 'Phase 1: The Minefield',
                text: 'The town square has been converted into a circus laced with hidden explosives.',
                choices: [
                    { label: 'Carefully disarm the traps', stat: 'int', dc: 14 },
                    { label: 'Spot the tripwires', stat: 'wis', dc: 15 }
                ]
            },
            {
                phaseName: 'Phase 2: The Beast Tamer',
                text: 'A massive lion blocks the path to the mayor\'s roof.',
                choices: [
                    { label: 'Wrestle the beast down', stat: 'str', dc: 16 },
                    { label: 'Soothe the animal', stat: 'cha', dc: 14 }
                ]
            }
        ],
        bossText: 'A pirate with a big red nose separates his upper half from his legs, floating into the air with daggers drawn!'
    },
    {
        id: 'silent_assassin',
        tier: 2,
        name: 'The Silent Mansion',
        reward: { gold: 1000, exp: 400 },
        encounterKey: 'QUEST_KURO',
        stages: [
            {
                phaseName: 'Phase 1: The Ambush',
                text: 'You are walking up the hill when hidden traps spring from the trees.',
                choices: [
                    { label: 'Dodge the falling blades', stat: 'dex', dc: 15 },
                    { label: 'Endure the glancing blows', stat: 'con', dc: 14 }
                ]
            },
            {
                phaseName: 'Phase 2: The Dark Hallways',
                text: 'Inside the mansion, the lights are cut. You hear incredibly fast footsteps.',
                choices: [
                    { label: 'Listen for their breathing', stat: 'wis', dc: 16 },
                    { label: 'Anticipate the attack angle', stat: 'int', dc: 15 }
                ]
            }
        ],
        bossText: 'Adjusting his glasses with the palm of his hand, the butler extends ten massive, razor-sharp blades from his fingertips.'
    },

    // ── TIER 3 (Levels 5-6) ───────────────────────────────────────────────────
    {
        id: 'saw_shark_park',
        tier: 3,
        name: 'The Flooded Empire',
        reward: { gold: 1800, exp: 750 },
        encounterKey: 'QUEST_ARLONG',
        stages: [
            {
                phaseName: 'Phase 1: The Maelstrom',
                text: 'The entrance to the park is guarded by artificially created whirlpools.',
                choices: [
                    { label: 'Swim against the crushing current', stat: 'str', dc: 17 },
                    { label: 'Hold your breath and dive beneath', stat: 'con', dc: 16 }
                ]
            },
            {
                phaseName: 'Phase 2: The Sea Cow',
                text: 'A massive sea beast emerges from the water, roaring fiercely.',
                choices: [
                    { label: 'Intimidate the monster', stat: 'cha', dc: 17 },
                    { label: 'Outmaneuver it on the rubble', stat: 'dex', dc: 16 }
                ]
            }
        ],
        bossText: 'A towering Fish-Man rips a massive jagged blade from the stone floor and points it squarely at your chest.'
    },
    {
        id: 'white_hunter',
        tier: 3,
        name: 'The Smog Blockade',
        reward: { gold: 2000, exp: 800 },
        encounterKey: 'QUEST_SMOKER',
        stages: [
            {
                phaseName: 'Phase 1: The Checkpoint',
                text: 'Marines have locked down the port. Thick smoke makes it impossible to see.',
                choices: [
                    { label: 'Navigate via the wind currents', stat: 'wis', dc: 17 },
                    { label: 'Recall the town\'s layout', stat: 'int', dc: 16 }
                ]
            },
            {
                phaseName: 'Phase 2: The Chokehold',
                text: 'The smoke suddenly solidifies around you, acting like a constricting snake.',
                choices: [
                    { label: 'Force the bindings open', stat: 'str', dc: 18 },
                    { label: 'Slip out before it tightens', stat: 'dex', dc: 17 }
                ]
            }
        ],
        bossText: 'Two cigars burning in his mouth, the Marine Captain turns his arm into a cloud of dense smoke and lunges.'
    },

    // ── TIER 4 (Levels 7-8) ───────────────────────────────────────────────────
    {
        id: 'desert_king',
        tier: 4,
        name: 'The Casino Heist',
        reward: { gold: 4000, exp: 1500 },
        encounterKey: 'QUEST_CROCODILE',
        stages: [
            {
                phaseName: 'Phase 1: The Scorching Dunes',
                text: 'You must cross the desert to reach the Warlord\'s casino. The heat is lethal.',
                choices: [
                    { label: 'Endure the blistering sun', stat: 'con', dc: 18 },
                    { label: 'Track the hidden oasis', stat: 'wis', dc: 17 }
                ]
            },
            {
                phaseName: 'Phase 2: The VIP Lounge',
                text: 'The golden doors are guarded by elite bounty hunters looking for a password.',
                choices: [
                    { label: 'Bluff your way inside', stat: 'cha', dc: 19 },
                    { label: 'Scale the glass exterior', stat: 'dex', dc: 18 }
                ]
            }
        ],
        bossText: 'Sitting comfortably in his chair, the Warlord exhales a puff of smoke as his entire lower body turns to swirling, lethal sand.'
    }
];