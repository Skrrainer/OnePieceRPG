// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — engine/navalCombat.js
//  Grid-based Naval Combat Engine with Placement Phase. 
//  0: Water, 1: Ship(Hidden), 2: Miss, 3: Hit
// ═══════════════════════════════════════════════════════════════════════════

import { showToast } from '../ui/renderEvents.js';

export const NAVAL_GRID_SIZE = 8;

export const NAVAL_ACTIONS = {
    CANNON:  { id: 'CANNON', name: 'Cannonball', cost: 1, icon: '💣', desc: 'Hits 1 square.' },
    SLASH:   { id: 'SLASH', name: 'Sword Slash', cost: 3, icon: '⚔️', desc: 'Hits a 1x3 horizontal line.' },
    HAKI:    { id: 'HAKI', name: 'Observation Haki', cost: 2, icon: '👁️', desc: 'Reveals ship parts in a 3x3 area (No DMG).' },
    GATLING: { id: 'GATLING', name: 'Gatling', cost: 4, icon: '👊', desc: 'Hits 5 completely random squares.' }
};

export const SHIP_SHAPES = {
    MAST: (isHorizontal) => isHorizontal ? [[0,0],[1,0],[2,0]] : [[0,0],[0,1],[0,2]], // 1x3
    ARSENAL: () => [[0,0],[1,0],[0,1],[1,1]], // 2x2 (Orientation doesn't matter)
    CABIN: () => [[0,0]] // 1x1
};

export const SHIP_NAMES = {
    MAST: 'Main Mast (3 blocks)',
    ARSENAL: 'Arsenal (2x2 blocks)',
    CABIN: 'Captain\'s Cabin (1 block)'
};

let state = {
    isActive: false,
    phase: 'PLACEMENT', // 'PLACEMENT' or 'COMBAT'
    playerGrid: [],
    enemyGrid: [],
    energy: 0,
    maxEnergy: 5,
    selectedAction: 'CANNON',
    unplacedShips: ['MAST', 'ARSENAL', 'CABIN'],
    onStateChange: null,
    onEnd: null
};

export function startNavalCombat(maxEnergy, onStateChange, onEnd) {
    state.isActive = true;
    state.phase = 'PLACEMENT';
    state.maxEnergy = maxEnergy;
    state.energy = maxEnergy;
    state.onStateChange = onStateChange;
    state.onEnd = onEnd;
    state.selectedAction = 'CANNON';
    state.unplacedShips = ['MAST', 'ARSENAL', 'CABIN'];

    // Initialize empty grids
    state.playerGrid = Array(NAVAL_GRID_SIZE).fill(null).map(() => Array(NAVAL_GRID_SIZE).fill(0));
    state.enemyGrid = Array(NAVAL_GRID_SIZE).fill(null).map(() => Array(NAVAL_GRID_SIZE).fill(0));

    // Enemy AI randomly places their ships
    _randomlyPlaceShips(state.enemyGrid);

    state.onStateChange(state);
}

// ── Placement Phase Logic ──

export function checkPlacementValid(grid, startX, startY, shipKey, isHorizontal) {
    const coords = SHIP_SHAPES[shipKey](isHorizontal);
    for (let pos of coords) {
        const x = startX + pos[0];
        const y = startY + pos[1];
        // Check bounds
        if (x < 0 || x >= NAVAL_GRID_SIZE || y < 0 || y >= NAVAL_GRID_SIZE) return false;
        // Check overlap
        if (grid[y][x] !== 0) return false;
    }
    return true;
}

export function placePlayerShip(startX, startY, shipKey, isHorizontal) {
    if (state.phase !== 'PLACEMENT' || !state.unplacedShips.includes(shipKey)) return;

    if (checkPlacementValid(state.playerGrid, startX, startY, shipKey, isHorizontal)) {
        const coords = SHIP_SHAPES[shipKey](isHorizontal);
        for (let pos of coords) {
            state.playerGrid[startY + pos[1]][startX + pos[0]] = 1;
        }
        state.unplacedShips = state.unplacedShips.filter(s => s !== shipKey);
        state.onStateChange(state);
    } else {
        showToast('Invalid placement! Ships cannot overlap or go out of bounds.', 'danger');
    }
}

export function beginCombatPhase() {
    if (state.unplacedShips.length > 0) return;
    state.phase = 'COMBAT';
    showToast('All hands on deck! Engage the enemy!', 'gold');
    state.onStateChange(state);
}

function _randomlyPlaceShips(grid) {
    const shipsToPlace = ['MAST', 'ARSENAL', 'CABIN'];
    for (const shipKey of shipsToPlace) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const isHorizontal = Math.random() > 0.5;
            const x = Math.floor(Math.random() * NAVAL_GRID_SIZE);
            const y = Math.floor(Math.random() * NAVAL_GRID_SIZE);

            if (checkPlacementValid(grid, x, y, shipKey, isHorizontal)) {
                const coords = SHIP_SHAPES[shipKey](isHorizontal);
                for (let pos of coords) {
                    grid[y + pos[1]][x + pos[0]] = 1;
                }
                placed = true;
            }
            attempts++;
        }
    }
}

// ── Combat Phase Logic ──

export function selectNavalAction(actionId) {
    if (state.phase !== 'COMBAT') return;
    state.selectedAction = actionId;
    state.onStateChange(state);
}

export function executePlayerAction(x, y) {
    if (!state.isActive || state.phase !== 'COMBAT') return;

    // Prevent hitting the same spot twice with standard attacks
    if (state.selectedAction === 'CANNON' && state.enemyGrid[y][x] > 1) {
        return; // Already hit or missed
    }

    const action = NAVAL_ACTIONS[state.selectedAction];

    if (state.energy < action.cost) {
        showToast(`Not enough energy! Needs ${action.cost}.`, 'danger');
        return;
    }

    state.energy -= action.cost;
    let hitSomething = false;

    if (action.id === 'CANNON') {
        hitSomething = _fireAt(state.enemyGrid, x, y);
    }
    else if (action.id === 'SLASH') {
        for (let i = 0; i < 3; i++) {
            if (x + i < NAVAL_GRID_SIZE) {
                if (_fireAt(state.enemyGrid, x + i, y)) hitSomething = true;
            }
        }
    }
    else if (action.id === 'HAKI') {
        let partsFound = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < NAVAL_GRID_SIZE && ny >= 0 && ny < NAVAL_GRID_SIZE) {
                    if (state.enemyGrid[ny][nx] === 1) partsFound++;
                }
            }
        }
        showToast(`👁️ Haki senses ${partsFound} ship compartments in that zone!`, 'info');
    }
    else if (action.id === 'GATLING') {
        for (let i = 0; i < 5; i++) {
            let rx = Math.floor(Math.random() * NAVAL_GRID_SIZE);
            let ry = Math.floor(Math.random() * NAVAL_GRID_SIZE);
            if (_fireAt(state.enemyGrid, rx, ry)) hitSomething = true;
        }
    }

    if (['CANNON', 'SLASH', 'GATLING'].includes(action.id)) {
        if (hitSomething) showToast('💥 Direct Hit!', 'success');
        else showToast('💨 Splash! Missed.', 'info');
    }

    _checkWinCondition();
}

export function endNavalTurn() {
    if (!state.isActive || state.phase !== 'COMBAT') return;

    let shots = Math.floor(Math.random() * 2) + 2;
    for(let i = 0; i < shots; i++) {
        // AI will avoid shooting spots it already shot for efficiency
        let rx, ry, attempts = 0;
        do {
            rx = Math.floor(Math.random() * NAVAL_GRID_SIZE);
            ry = Math.floor(Math.random() * NAVAL_GRID_SIZE);
            attempts++;
        } while (state.playerGrid[ry][rx] > 1 && attempts < 50);

        _fireAt(state.playerGrid, rx, ry);
    }

    showToast(`Enemy returned fire!`, 'danger');

    state.energy = state.maxEnergy;
    _checkWinCondition();
}

function _fireAt(grid, x, y) {
    if (grid[y][x] === 0) {
        grid[y][x] = 2; // Miss
        return false;
    } else if (grid[y][x] === 1) {
        grid[y][x] = 3; // Hit
        return true;
    }
    return false;
}

function _checkWinCondition() {
    const enemyDead = state.enemyGrid.flat().filter(cell => cell === 1).length === 0;
    const playerDead = state.playerGrid.flat().filter(cell => cell === 1).length === 0;

    if (enemyDead) {
        state.isActive = false;
        state.onEnd(true);
    } else if (playerDead) {
        state.isActive = false;
        state.onEnd(false);
    } else {
        state.onStateChange(state);
    }
}