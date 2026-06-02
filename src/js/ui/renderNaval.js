// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderNaval.js
//  Draws the grids and handles placement/combat UI.
// ═══════════════════════════════════════════════════════════════════════════

import {
    NAVAL_GRID_SIZE,
    NAVAL_ACTIONS,
    SHIP_NAMES,
    SHIP_SHAPES,
    selectNavalAction,
    executePlayerAction,
    endNavalTurn,
    placePlayerShip,
    checkPlacementValid,
    beginCombatPhase
} from '../engine/navalCombat.js';

let currentState = null;
let placementState = {
    selectedShip: 'MAST',
    isHorizontal: true
};

export function updateNavalUI(state) {
    currentState = state;

    // Header UI
    const headerTitle = document.querySelector('#naval-overlay .modal-box__title');
    const energyDisplay = document.getElementById('naval-energy').parentElement;

    if (state.phase === 'PLACEMENT') {
        headerTitle.innerHTML = '⚓ Prepare for Battle';
        energyDisplay.style.display = 'none';

        // Default to first unplaced ship if current is placed
        if (!state.unplacedShips.includes(placementState.selectedShip) && state.unplacedShips.length > 0) {
            placementState.selectedShip = state.unplacedShips[0];
        }
    } else {
        headerTitle.innerHTML = '⚓ Naval Interception';
        energyDisplay.style.display = 'block';
        document.getElementById('naval-energy').textContent = state.energy;
        document.getElementById('naval-energy-max').textContent = state.maxEnergy;
    }

    _renderPlayerGrid(state);

    const enemyContainer = document.getElementById('naval-enemy-grid').parentElement;
    if (state.phase === 'PLACEMENT') {
        enemyContainer.style.display = 'none';
        _renderPlacementControls(state);
    } else {
        enemyContainer.style.display = 'block';
        _renderEnemyGrid(state.enemyGrid);
        _renderCombatControls(state);
    }
}

// ── Rendering Grids ──

function _renderPlayerGrid(state) {
    const gridData = state.playerGrid;
    const grid = document.getElementById('naval-player-grid');
    grid.innerHTML = '';

    for (let y = 0; y < NAVAL_GRID_SIZE; y++) {
        for (let x = 0; x < NAVAL_GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.style.aspectRatio = '1/1';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '1.2rem';
            cell.style.transition = 'background 0.1s';

            const val = gridData[y][x];
            if (val === 0) cell.style.background = 'rgba(0, 100, 255, 0.2)';
            if (val === 1) cell.style.background = 'rgba(150, 150, 150, 0.8)';
            if (val === 2) { cell.style.background = 'rgba(0, 50, 150, 0.5)'; cell.textContent = '💦'; }
            if (val === 3) { cell.style.background = 'rgba(255, 50, 50, 0.8)'; cell.textContent = '🔥'; }

            // Placement Interactions
            if (state.phase === 'PLACEMENT' && state.unplacedShips.length > 0) {
                cell.style.cursor = 'pointer';
                cell.onmouseover = () => _applyPlacementHover(gridData, x, y, true);
                cell.onmouseout = () => _applyPlacementHover(gridData, x, y, false);
                cell.onclick = () => placePlayerShip(x, y, placementState.selectedShip, placementState.isHorizontal);
            }

            grid.appendChild(cell);
        }
    }
}

function _renderEnemyGrid(gridData) {
    const grid = document.getElementById('naval-enemy-grid');
    grid.innerHTML = '';

    for (let y = 0; y < NAVAL_GRID_SIZE; y++) {
        for (let x = 0; x < NAVAL_GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'naval-enemy-cell';
            cell.style.aspectRatio = '1/1';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '1.2rem';
            cell.style.cursor = 'crosshair';
            cell.style.transition = 'background 0.2s';

            const val = gridData[y][x];
            if (val === 0 || val === 1) cell.style.background = 'rgba(0, 100, 255, 0.1)';
            if (val === 2) { cell.style.background = 'rgba(0, 50, 150, 0.5)'; cell.textContent = '💦'; cell.style.cursor = 'default'; }
            if (val === 3) { cell.style.background = 'rgba(255, 50, 50, 0.8)'; cell.textContent = '💥'; cell.style.cursor = 'default'; }

            if (currentState.phase === 'COMBAT') {
                cell.onmouseover = () => _applyCombatHover(x, y, true);
                cell.onmouseout = () => _applyCombatHover(x, y, false);
                cell.onclick = () => executePlayerAction(x, y);
            }

            grid.appendChild(cell);
        }
    }
}

// ── Hover Effects ──

function _applyPlacementHover(gridData, startX, startY, isHovering) {
    const grid = document.getElementById('naval-player-grid');
    const cells = grid.children;

    // Clear all temporary highlights first to prevent sticking
    for (let i = 0; i < cells.length; i++) {
        const x = i % NAVAL_GRID_SIZE;
        const y = Math.floor(i / NAVAL_GRID_SIZE);
        if (gridData[y][x] === 0) cells[i].style.background = 'rgba(0, 100, 255, 0.2)';
    }

    if (!isHovering || currentState.unplacedShips.length === 0) return;

    const shipKey = placementState.selectedShip;
    const isHorizontal = placementState.isHorizontal;
    const isValid = checkPlacementValid(gridData, startX, startY, shipKey, isHorizontal);

    const highlightColor = isValid ? 'rgba(76, 175, 114, 0.6)' : 'rgba(255, 107, 107, 0.6)';

    const coords = SHIP_SHAPES[shipKey](isHorizontal);
    for (let pos of coords) {
        const x = startX + pos[0];
        const y = startY + pos[1];
        if (x >= 0 && x < NAVAL_GRID_SIZE && y >= 0 && y < NAVAL_GRID_SIZE) {
            const index = y * NAVAL_GRID_SIZE + x;
            if (gridData[y][x] === 0) { // Don't override already placed ships visually during hover
                cells[index].style.background = highlightColor;
            }
        }
    }
}

function _applyCombatHover(x, y, isHovering) {
    if (!currentState || currentState.phase !== 'COMBAT') return;
    const grid = document.getElementById('naval-enemy-grid');
    const cells = grid.children;
    const action = currentState.selectedAction;

    const highlightColor = isHovering ? 'rgba(255, 255, 255, 0.3)' : '';

    const colorCell = (cx, cy) => {
        if (cx >= 0 && cx < NAVAL_GRID_SIZE && cy >= 0 && cy < NAVAL_GRID_SIZE) {
            const index = cy * NAVAL_GRID_SIZE + cx;
            if (currentState.enemyGrid[cy][cx] < 2) {
                cells[index].style.background = isHovering ? highlightColor : 'rgba(0, 100, 255, 0.1)';
            }
        }
    };

    if (action === 'CANNON' || action === 'GATLING') {
        colorCell(x, y);
    } else if (action === 'SLASH') {
        for (let i = 0; i < 3; i++) colorCell(x + i, y);
    } else if (action === 'HAKI') {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                colorCell(x + dx, y + dy);
            }
        }
    }
}

// ── Control Bars ──

function _renderPlacementControls(state) {
    const container = document.getElementById('naval-actions-container');
    container.innerHTML = '';

    if (state.unplacedShips.length > 0) {
        const infoMsg = document.createElement('div');
        infoMsg.style.width = '100%';
        infoMsg.style.textAlign = 'center';
        infoMsg.style.marginBottom = '1rem';
        infoMsg.style.color = 'var(--color-text-secondary)';
        infoMsg.textContent = 'Select a compartment and click the grid to position it.';
        container.appendChild(infoMsg);

        state.unplacedShips.forEach(ship => {
            const btn = document.createElement('button');
            const isActive = placementState.selectedShip === ship;
            btn.className = `btn btn--sm ${isActive ? 'btn--primary' : 'btn--ghost'}`;
            btn.textContent = SHIP_NAMES[ship];
            btn.onclick = () => {
                placementState.selectedShip = ship;
                updateNavalUI(currentState);
            };
            container.appendChild(btn);
        });

        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'btn btn--ghost btn--sm';
        rotateBtn.style.marginLeft = 'auto';
        rotateBtn.innerHTML = `🔄 Rotate (${placementState.isHorizontal ? 'Horizontal' : 'Vertical'})`;
        rotateBtn.onclick = () => {
            placementState.isHorizontal = !placementState.isHorizontal;
            updateNavalUI(currentState);
        };
        container.appendChild(rotateBtn);
    } else {
        const startBtn = document.createElement('button');
        startBtn.className = 'btn btn--danger btn--full';
        startBtn.textContent = '⚔️ All Systems Go. Begin Combat!';
        startBtn.onclick = () => beginCombatPhase();
        container.appendChild(startBtn);
    }
}

function _renderCombatControls(state) {
    const container = document.getElementById('naval-actions-container');
    container.innerHTML = '';

    Object.values(NAVAL_ACTIONS).forEach(act => {
        const btn = document.createElement('button');
        const isActive = state.selectedAction === act.id;
        btn.className = `btn btn--sm ${isActive ? 'btn--primary' : 'btn--ghost'}`;
        btn.innerHTML = `${act.icon} ${act.name} (⚡${act.cost})`;
        btn.title = act.desc;
        btn.disabled = state.energy < act.cost;

        btn.onclick = () => selectNavalAction(act.id);
        container.appendChild(btn);
    });

    const endBtn = document.createElement('button');
    endBtn.className = 'btn btn--danger btn--sm';
    endBtn.style.marginLeft = 'auto';
    endBtn.textContent = '⏭️ End Turn';
    endBtn.onclick = () => endNavalTurn();
    container.appendChild(endBtn);
}