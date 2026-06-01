// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderHub.js
//  Island Hub UI: Tavern, Market, Shipyard rendering and action binding.
// ═══════════════════════════════════════════════════════════════════════════

import { HUB_SERVICES, DROP_RATES } from '../config/gameData.js';
import {
  getState,
  applyEventOutcome,
  restoreHp,
  repairShip,
  spendGold,
  addInventoryItem,
  addCannonballs,
  patchStats,
  toSaveObject,
} from '../engine/playerState.js';
import { pickFrom } from '../engine/rng.js';
import { savePlayer, fetchAvailableCrew, recruitFromRoster } from '../supabase/client.js';
import { addToCrewCache } from '../engine/crewState.js';
import { renderProfile, renderCrew } from './renderCharacter.js';
import { showToast } from './renderEvents.js';
import { generateLogPoseDestinations } from '../engine/navigation.js';
import { ISLANDS } from '../../config/islands.js';

// ── Render Hub ────────────────────────────────────────────────────────────

/**
 * Populates hub cards with dynamic content based on current player state.
 * Call this every time the hub screen becomes visible.
 * @param {import('../engine/playerState.js').PlayerState} state
 */
export function renderHub(state) {
  // ── Hub Header ──────────────────────────────────────────────────────────
  const hubTitle = document.getElementById('hub-title');
  if (hubTitle) {
    const currentIsland = ISLANDS.find(i => i.id === state.currentIsland);
    hubTitle.textContent = currentIsland ? currentIsland.name : 'Island of Respite';
  }

  // ── Tavern ──────────────────────────────────────────────────────────────
  const restBtn     = document.getElementById('tavern-rest-btn');
  const recruitBtn  = document.getElementById('tavern-recruit-btn');
  const tavernDesc  = document.getElementById('tavern-desc');

  if (tavernDesc) {
    const rumor = pickFrom(HUB_SERVICES.TAVERN.RUMOR_EVENTS);
    tavernDesc.textContent = `"${rumor}"`;
  }

  if (restBtn) {
    const hpMissing = state.maxHp - state.hp;
    restBtn.disabled = hpMissing <= 0;
    restBtn.textContent = hpMissing <= 0
        ? '😴 Already at full HP'
        : `😴 Rest (+${HUB_SERVICES.TAVERN.REST_HP_RESTORE} HP) — Free`;
  }

  if (recruitBtn) {
    recruitBtn.textContent = `🪝 Recruit Crew — ${HUB_SERVICES.TAVERN.RECRUIT_COST} Gold`;
    recruitBtn.disabled = state.gold < HUB_SERVICES.TAVERN.RECRUIT_COST;
  }

  // ── Market ──────────────────────────────────────────────────────────────
  const provBtn  = document.getElementById('market-provisions-btn');
  const cballBtn = document.getElementById('market-cannonball-btn');

  if (provBtn) {
    provBtn.textContent = `🥩 Buy Provisions — ${HUB_SERVICES.MARKET.PROVISIONS_COST} Gold`;
    provBtn.disabled    = state.gold < HUB_SERVICES.MARKET.PROVISIONS_COST;
  }
  if (cballBtn) {
    cballBtn.textContent = `💣 Buy Cannonballs (×${HUB_SERVICES.MARKET.CANNONBALL_USES}) — ${HUB_SERVICES.MARKET.CANNONBALL_COST} Gold`;
    cballBtn.disabled    = state.gold < HUB_SERVICES.MARKET.CANNONBALL_COST;
  }

  // ── Shipyard ─────────────────────────────────────────────────────────────
  const repairBtn  = document.getElementById('shipyard-repair-btn');
  const upgradeBtn = document.getElementById('shipyard-upgrade-btn');
  const hullMissing = state.shipHpMax - state.shipHp;
  const repairCost  = hullMissing * HUB_SERVICES.SHIPYARD.REPAIR_COST_PER_HP;

  if (repairBtn) {
    if (hullMissing <= 0) {
      repairBtn.disabled    = true;
      repairBtn.textContent = '🔧 Hull is Pristine';
    } else {
      repairBtn.disabled    = state.gold < repairCost;
      repairBtn.textContent = `🔧 Repair Hull (${hullMissing} pts) — ${repairCost} Gold`;
    }
  }

  if (upgradeBtn) {
    upgradeBtn.disabled    = state.gold < HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_COST;
    upgradeBtn.textContent = `⬆️ Upgrade Cannons (+${HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_ATTACK_BONUS} ATK) — ${HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_COST} Gold`;
  }

  // ── Navigation (Log Pose) ───────────────────────────────────────────────
  const logPoseContainer = document.getElementById('log-pose-destinations');
  if (logPoseContainer && (!logPoseContainer.hasChildNodes() || logPoseContainer.dataset.day !== String(state.day))) {
    const destinations = generateLogPoseDestinations();
    logPoseContainer.innerHTML = '';
    logPoseContainer.dataset.day = state.day;

    destinations.forEach(island => {
      const btn = document.createElement('button');
      btn.className = 'btn btn--ghost island-btn';
      btn.innerHTML = `
        <span class="island-icon">${island.icon}</span>
        <div class="island-info">
          <span class="island-name">${island.name}</span>
          <span class="island-type">${island.type}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.island-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Enable sail button and update text
        const sailBtn = document.getElementById('set-sail-btn');
        if (sailBtn) {
          sailBtn.disabled = false;
          sailBtn.textContent = `🌊 Set Sail to ${island.name}`;
          sailBtn.dataset.destination = island.id;
        }
      });

      logPoseContainer.appendChild(btn);
    });

    // Reset sail button state until an island is picked
    const sailBtn = document.getElementById('set-sail-btn');
    if (sailBtn) {
      sailBtn.disabled = true;
      sailBtn.textContent = '🧭 Select a Destination';
      delete sailBtn.dataset.destination;
    }
  }
}

// ── Bind Hub Actions ──────────────────────────────────────────────────────

/**
 * Attaches click handlers to all hub buttons.
 * Should be called once on app initialisation.
 */
export function bindHubActions() {
  // ── Tavern: Rest ─────────────────────────────────────────────────────────
  document.getElementById('tavern-rest-btn')?.addEventListener('click', async () => {
    const state = getState();
    if (state.hp >= state.maxHp) {
      _setResult('tavern-result', 'You\'re already at full health, Captain.', 'failure');
      return;
    }
    restoreHp(HUB_SERVICES.TAVERN.REST_HP_RESTORE);
    await _persist();
    renderProfile(getState());
    renderHub(getState());
    _setResult('tavern-result', `Rested. +${HUB_SERVICES.TAVERN.REST_HP_RESTORE} HP restored.`, 'success');
    showToast('😴 Well rested, Captain.', 'success');
  });

  // ── Tavern: Recruit ───────────────────────────────────────────────────────
  document.getElementById('tavern-recruit-btn')?.addEventListener('click', async () => {
    const state = getState();
    if (!spendGold(HUB_SERVICES.TAVERN.RECRUIT_COST)) {
      _setResult('tavern-result', 'Not enough gold to recruit.', 'failure');
      return;
    }

    const success = Math.random() < DROP_RATES.CREW_RECRUIT_SUCCESS;
    if (!success) {
      await _persist();
      renderProfile(getState());
      renderHub(getState());
      _setResult('tavern-result', 'The recruits weren\'t impressed. Gold spent, crew not found.', 'failure');
      showToast('🪝 No takers at the tavern tonight.', 'danger');
      return;
    }

    // Fetch roster members this player hasn't recruited yet
    const { data: available } = await fetchAvailableCrew(state.id);
    if (!available || available.length === 0) {
      _setResult('tavern-result', 'You\'ve recruited everyone available. Check back later.', 'failure');
      return;
    }

    // Pick a random available crew member
    const picked = available[Math.floor(Math.random() * available.length)];

    // Record the recruitment in player_crew database table
    await recruitFromRoster(state.id, picked.id, state.day);

    // Add to local cache with joined_day attached
    const member = { ...picked, joined_day: state.day };
    addToCrewCache(member);

    await _persist();
    renderProfile(getState());
    renderCrew();
    renderHub(getState());
    _setResult('tavern-result', `${picked.name} joined your crew!`, 'success');
    showToast(`🪝 ${picked.name} has joined the crew!`, 'gold');
  });

  // ── Market: Provisions ────────────────────────────────────────────────────
  document.getElementById('market-provisions-btn')?.addEventListener('click', async () => {
    if (!spendGold(HUB_SERVICES.MARKET.PROVISIONS_COST)) {
      _setResult('market-result', 'Not enough gold for provisions.', 'failure');
      return;
    }
    addInventoryItem('Provisions');
    applyEventOutcome({ hp: HUB_SERVICES.MARKET.PROVISIONS_HP_BONUS });
    await _persist();
    renderProfile(getState());
    renderHub(getState());
    _setResult('market-result', `Provisions purchased. +${HUB_SERVICES.MARKET.PROVISIONS_HP_BONUS} HP.`, 'success');
    showToast('🥩 Provisions loaded aboard.', 'success');
  });

  // ── Market: Cannonballs ───────────────────────────────────────────────────
  document.getElementById('market-cannonball-btn')?.addEventListener('click', async () => {
    if (!spendGold(HUB_SERVICES.MARKET.CANNONBALL_COST)) {
      _setResult('market-result', 'Not enough gold for cannonballs.', 'failure');
      return;
    }
    addCannonballs(HUB_SERVICES.MARKET.CANNONBALL_USES);
    await _persist();
    renderProfile(getState());
    renderHub(getState());
    _setResult('market-result', `${HUB_SERVICES.MARKET.CANNONBALL_USES} cannonball charges acquired.`, 'success');
    showToast('💣 Cannonballs loaded!', 'success');
  });

  // ── Shipyard: Repair ──────────────────────────────────────────────────────
  document.getElementById('shipyard-repair-btn')?.addEventListener('click', async () => {
    const state       = getState();
    const hullMissing = state.shipHpMax - state.shipHp;
    const cost        = hullMissing * HUB_SERVICES.SHIPYARD.REPAIR_COST_PER_HP;

    if (hullMissing <= 0) {
      _setResult('shipyard-result', 'The hull is already pristine.', 'failure');
      return;
    }
    if (!spendGold(cost)) {
      _setResult('shipyard-result', `Need ${cost} Gold to fully repair. Not enough.`, 'failure');
      return;
    }
    repairShip(hullMissing);
    await _persist();
    renderProfile(getState());
    renderHub(getState());
    _setResult('shipyard-result', `Hull fully repaired for ${cost} Gold.`, 'success');
    showToast('⚙️ Hull patched up — good as new!', 'success');
  });

  // ── Shipyard: Upgrade Cannons ─────────────────────────────────────────────
  document.getElementById('shipyard-upgrade-btn')?.addEventListener('click', async () => {
    if (!spendGold(HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_COST)) {
      _setResult('shipyard-result', 'Not enough gold to upgrade cannons.', 'failure');
      return;
    }
    patchStats({ attack: HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_ATTACK_BONUS });
    await _persist();
    renderProfile(getState());
    renderHub(getState());
    _setResult('shipyard-result', `Cannons upgraded! +${HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_ATTACK_BONUS} Attack.`, 'success');
    showToast(`⬆️ Cannons upgraded! +${HUB_SERVICES.SHIPYARD.UPGRADE_CANNON_ATTACK_BONUS} ATK`, 'gold');
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function _persist() {
  const { error } = await savePlayer(toSaveObject());
  if (error && error.message !== 'Supabase not configured') {
    console.warn('[GLD] Hub save error:', error.message);
  }
}

function _setResult(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className   = `hub-card__result ${type}`;
  // Auto-clear after 4s
  setTimeout(() => {
    if (el.textContent === message) {
      el.textContent = '';
      el.className   = 'hub-card__result';
    }
  }, 4000);
}