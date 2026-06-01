// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderInventory.js
//  Manages the inventory overlay, slots, and consuming items.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, removeInventoryItem, equipDevilFruit, restoreHp, toSaveObject } from '../engine/playerState.js';
import { claimDevilFruit, savePlayer } from '../supabase/client.js';
import { renderProfile } from './renderCharacter.js';
import { showToast } from './renderEvents.js';

export function initInventory() {
    document.getElementById('btn-inventory')?.addEventListener('click', openInventory);
    document.getElementById('inventory-close-btn')?.addEventListener('click', closeInventory);
}

export function openInventory() {
    renderInventoryGrid();
    document.getElementById('inventory-overlay').hidden = false;
}

export function closeInventory() {
    document.getElementById('inventory-overlay').hidden = true;
}

function renderInventoryGrid() {
    const state = getState();
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    // Create a minimum of 16 slots (or more if inventory is large)
    const totalSlots = Math.max(16, state.inventory.length + (4 - state.inventory.length % 4));

    for(let i=0; i<totalSlots; i++) {
        const slot = document.createElement('div');
        // Inline styles to ensure it looks like a game slot regardless of CSS
        slot.style.aspectRatio = '1/1';
        slot.style.border = '1px solid var(--border-color, #444)';
        slot.style.borderRadius = '4px';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.fontSize = '2rem';
        slot.style.background = 'rgba(0,0,0,0.3)';

        const item = state.inventory[i];
        if (item) {
            slot.style.cursor = 'pointer';
            slot.style.background = 'rgba(255,255,255,0.05)';
            slot.innerHTML = `<span>${item.icon || '📦'}</span>`;
            slot.addEventListener('click', () => showItemDetails(item, i));
        }
        grid.appendChild(slot);
    }

    showItemDetails(null);
}

function showItemDetails(item, index) {
    const details = document.getElementById('inventory-details');
    const state = getState();

    if (!item) {
        details.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 2rem;">Select an item to view details.</p>';
        return;
    }

    let actionsHtml = '';

    if (item.type === 'devil_fruit') {
        if (state.hasFruit) {
            actionsHtml = `<button class="btn btn--danger btn--full" disabled>Cannot Eat (Already possess powers)</button>`;
        } else {
            actionsHtml = `<button class="btn btn--primary btn--full" id="btn-eat-fruit">Eat Fruit</button>`;
        }
    } else if (item.name === 'Provisions') {
        actionsHtml = `<button class="btn btn--primary btn--full" id="btn-eat-provisions">Consume (+20 HP)</button>`;
    } else {
        actionsHtml = `<button class="btn btn--ghost btn--full" id="btn-drop-item">Toss Overboard</button>`;
    }

    details.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 3rem;">${item.icon || '📦'}</span>
            <h4 style="margin: 0; font-size: 1.2rem; color: var(--gold, #d4af37);">${item.name}</h4>
        </div>
        <p style="margin-bottom: 2rem;">${item.description || 'Standard maritime supplies.'}</p>
        <div>${actionsHtml}</div>
    `;

    document.getElementById('btn-eat-fruit')?.addEventListener('click', async () => {
        if (confirm(`Eat the ${item.name}? You will lose the ability to swim permanently.`)) {
            equipDevilFruit(item);
            removeInventoryItem(index);
            await claimDevilFruit(state.id, item.id);
            await savePlayer(toSaveObject());
            renderProfile(getState());
            renderInventoryGrid();
            showToast(`You ate the ${item.name}!`, 'gold');
        }
    });

    document.getElementById('btn-eat-provisions')?.addEventListener('click', async () => {
        const currentState = getState();
        if (currentState.hp >= currentState.maxHp) {
            showToast('You are already full!', 'info');
            return;
        }
        restoreHp(20);
        removeInventoryItem(index);
        await savePlayer(toSaveObject());
        renderProfile(getState());
        renderInventoryGrid();
        showToast('Ate Provisions. +20 HP', 'success');
    });

    document.getElementById('btn-drop-item')?.addEventListener('click', async () => {
        removeInventoryItem(index);
        await savePlayer(toSaveObject());
        renderInventoryGrid();
        showToast(`Tossed ${item.name} overboard.`, 'info');
    });
}