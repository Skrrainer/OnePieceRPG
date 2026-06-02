// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderInventory.js
//  Manages the inventory overlay, equipment slots, and item consumption.
// ═══════════════════════════════════════════════════════════════════════════

import {
    getState,
    removeInventoryItem,
    equipDevilFruit,
    restoreHp,
    toSaveObject,
    equipItem,
    unequipItem
} from '../engine/playerState.js';
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

    // ── 1. Render Equipped Slots ──
    const slots = ['weapon', 'armor', 'accessory'];
    slots.forEach(slotKey => {
        const slotEl = document.getElementById(`equip-slot-${slotKey}`);
        if (!slotEl) return;

        const equippedItem = state.equipment[slotKey];
        if (equippedItem) {
            slotEl.innerHTML = `<span>${equippedItem.icon || '🛡️'}</span>`;
            slotEl.style.background = 'rgba(255, 255, 255, 0.1)';
            slotEl.onclick = () => showItemDetails(equippedItem, null, true, slotKey);
        } else {
            slotEl.innerHTML = `<span style="opacity: 0.2; font-size: 1rem; position: absolute; text-transform: capitalize;">${slotKey}</span>`;
            slotEl.style.background = 'rgba(0,0,0,0.3)';
            slotEl.onclick = null;
        }
    });

    // ── 2. Render Bag Grid ──
    const totalSlots = Math.max(16, state.inventory.length + (4 - state.inventory.length % 4));

    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
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
            slot.addEventListener('click', () => showItemDetails(item, i, false, null));
        }
        grid.appendChild(slot);
    }

    showItemDetails(null);
}

function showItemDetails(item, index, isEquipped = false, slotKey = null) {
    const details = document.getElementById('inventory-details');
    const state = getState();

    if (!item) {
        details.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 2rem;">Select an item to view details.</p>';
        return;
    }

    let actionsHtml = '';

    if (isEquipped) {
        actionsHtml = `<button class="btn btn--ghost btn--full" id="btn-unequip-item">Unequip ${item.name}</button>`;
    } else {
        if (['weapon', 'armor', 'accessory'].includes(item.type)) {
            actionsHtml = `<button class="btn btn--primary btn--full" id="btn-equip-item">Equip to ${item.type}</button>`;
        } else if (item.type === 'devil_fruit') {
            if (state.hasFruit) {
                actionsHtml = `<button class="btn btn--danger btn--full" disabled>Cannot Eat (Already possess powers)</button>`;
            } else {
                actionsHtml = `<button class="btn btn--primary btn--full" id="btn-eat-fruit">Eat Fruit</button>`;
            }
        } else if (item.name === 'Provisions' || item.type === 'consumable') {
            actionsHtml = `<button class="btn btn--primary btn--full" id="btn-eat-provisions">Consume (+20 HP)</button>`;
        } else {
            actionsHtml = `<button class="btn btn--ghost btn--full" id="btn-drop-item">Toss Overboard</button>`;
        }
    }

    // Render Stats if present
    let statsHtml = '';
    if (item.baseAc) statsHtml += `<span style="display:inline-block; margin-right: 10px; color: #a0d8ef;">🛡️ AC: ${item.baseAc}</span>`;
    if (item.damageDice) statsHtml += `<span style="display:inline-block; margin-right: 10px; color: #ff6b6b;">⚔️ DMG: ${item.damageDice}</span>`;

    details.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 3rem;">${item.icon || '📦'}</span>
            <div>
              <h4 style="margin: 0; font-size: 1.2rem; color: var(--gold, #d4af37);">${item.name}</h4>
              <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-muted);">${item.type}</div>
            </div>
        </div>
        <div style="margin-bottom: 1rem; font-weight: bold;">${statsHtml}</div>
        <p style="margin-bottom: 2rem;">${item.description || 'Standard maritime supplies.'}</p>
        <div>${actionsHtml}</div>
    `;

    // Bind Action Buttons
    document.getElementById('btn-equip-item')?.addEventListener('click', async () => {
        // Remove from bag first
        removeInventoryItem(index);
        // Force slot assignment
        item.slot = item.type;
        equipItem(item);

        await savePlayer(toSaveObject());
        renderProfile(getState());
        renderInventoryGrid();
        showToast(`Equipped ${item.name}`, 'info');
    });

    document.getElementById('btn-unequip-item')?.addEventListener('click', async () => {
        unequipItem(slotKey);
        await savePlayer(toSaveObject());
        renderProfile(getState());
        renderInventoryGrid();
        showToast(`Unequipped ${item.name}`, 'info');
    });

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