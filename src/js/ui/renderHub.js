// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderHub.js
//  Island Hub UI: Tavern, Market, Shipyard rendering and action binding.
// ═══════════════════════════════════════════════════════════════════════════

import { HUB_SERVICES, DROP_RATES, CLASSES } from '../config/gameData.js';
import { QUESTS } from '../config/quests.js';
import {
  getState,
  applyEventOutcome,
  restoreHp,
  repairShip,
  spendGold,
  addInventoryItem,
  toSaveObject,
  setActiveQuest,
  advanceQuestStage,
  gainExp,
  getModifier,
  clearCurrentIsland,
  chargeLogPose,
  incrementDay
} from '../engine/playerState.js';
import { pickFrom, rollStatCheck } from '../engine/rng.js';
import { savePlayer, fetchAvailableCrew, recruitFromRoster } from '../supabase/client.js';
import { addToCrewCache, getCrew } from '../engine/crewState.js';
import { renderProfile, renderCrew, updateHubDay } from './renderCharacter.js';
import { showToast } from './renderEvents.js';
import { generateLogPoseDestinations } from '../engine/navigation.js';
import { ISLANDS } from '../../config/islands.js';

const MARKET_ITEMS = [
  { id: 'cutlass', name: 'Steel Cutlass', type: 'weapon', description: 'A reliable blade used by Marines and Pirates alike.', damageDice: '1d8', icon: '🗡️', cost: 100 },
  { id: 'flintlock', name: 'Flintlock Pistol', type: 'weapon', description: 'Good for keeping distance.', damageDice: '1d10', icon: '🔫', cost: 150 },
  { id: 'leather_coat', name: 'Leather Coat', type: 'armor', description: 'Thick leather coat. Offers basic protection.', baseAc: 12, icon: '🧥', cost: 120 },
  { id: 'iron_buckler', name: 'Iron Buckler', type: 'accessory', description: 'A small, sturdy shield.', baseAc: 1, icon: '🛡️', cost: 80 },
  { id: 'provisions', name: 'Provisions', type: 'consumable', description: 'Maritime rations. Restores 20 HP.', icon: '🥩', cost: 50 }
];

const DISPATCH_TASKS = [
  { id: 'scavenge', name: 'Scavenge Docks', primaryStat: 'str', duration: 30000, desc: 'Send a mate to look for raw materials.' },
  { id: 'intercept', name: 'Hack Frequencies', primaryStat: 'int', duration: 60000, desc: 'Intercept Den Den signals for intel.' },
  { id: 'gather', name: 'Hunt Wildlife', primaryStat: 'dex', duration: 45000, desc: 'Procure extra provisions from land.' }
];

export function renderHub(state) {
  const hubTitle = document.getElementById('hub-title');
  if (hubTitle) {
    const currentIsland = ISLANDS.find(i => i.id === state.currentIsland);
    hubTitle.textContent = currentIsland ? currentIsland.name : 'Island of Respite';
  }

  _renderTavernBoard(state);
  _renderCrewDispatch(state);

  const restBtn = document.getElementById('tavern-rest-btn');
  if (restBtn) {
    const hpMissing = state.maxHp - state.hp;
    restBtn.disabled = hpMissing <= 0;
    restBtn.textContent = hpMissing <= 0 ? '😴 Fully Rested' : `😴 Rest (+20 HP) — Costs 1 Day`;
  }

  const recruitBtn = document.getElementById('tavern-recruit-btn');
  if (recruitBtn) {
    recruitBtn.textContent = `🪝 Recruit Crew — ${HUB_SERVICES.TAVERN.RECRUIT_COST} Gold`;
    recruitBtn.disabled = state.gold < HUB_SERVICES.TAVERN.RECRUIT_COST;
  }

  const repairBtn  = document.getElementById('shipyard-repair-btn');
  const hullMissing = state.shipHpMax - state.shipHp;
  const repairCost  = hullMissing * HUB_SERVICES.SHIPYARD.REPAIR_COST_PER_HP;

  if (repairBtn) {
    if (hullMissing <= 0) {
      repairBtn.disabled = true;
      repairBtn.textContent = '🔧 Hull is Pristine';
    } else {
      repairBtn.disabled = state.gold < repairCost;
      repairBtn.textContent = `🔧 Repair Hull (${hullMissing} pts) — ${repairCost} Gold`;
    }
  }

  // ── Locked Port Navigation Logic ──
  const logPoseContainer = document.getElementById('log-pose-destinations');
  if (logPoseContainer) {
    if (!logPoseContainer.hasChildNodes() || logPoseContainer.dataset.day !== String(state.day)) {
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
          const sailBtn = document.getElementById('set-sail-btn');
          if (sailBtn) {
            const isCleared = getState().clearedIslands.includes(getState().currentIsland);
            const isCharged = getState().logPoseCharge >= 3;

            if (!isCleared) {
              sailBtn.disabled = true;
              sailBtn.textContent = `🔒 Port Locked (Defeat Island Boss)`;
            } else if (!isCharged) {
              sailBtn.disabled = true;
              sailBtn.textContent = `🔒 Log Pose Setting (${getState().logPoseCharge}/3 Days)`;
            } else {
              sailBtn.disabled = false;
              sailBtn.textContent = `🌊 Set Sail to ${island.name}`;
            }
            sailBtn.dataset.destination = island.id;
          }
        });
        logPoseContainer.appendChild(btn);
      });

      const sailBtn = document.getElementById('set-sail-btn');
      if (sailBtn) {
        sailBtn.disabled = true;
        sailBtn.textContent = '🧭 Select a Destination';
      }
    }
  }
}

// ── Dynamic Quest Generator ───────────────────────────────────────────────

function _renderTavernBoard(state) {
  const tavernCard = document.getElementById('hub-tavern');
  if (!tavernCard) return;

  let boardSection = document.getElementById('tavern-job-board');
  if (!boardSection) {
    boardSection = document.createElement('div');
    boardSection.id = 'tavern-job-board';
    boardSection.style.borderTop = '1px dashed var(--border-color)';
    boardSection.style.marginTop = '1rem';
    boardSection.style.paddingTop = '1rem';
    tavernCard.appendChild(boardSection);
  }

  if (state.activeQuest) {
    const qDef = QUESTS.find(q => q.id === state.activeQuest.id);
    if (!qDef) return;

    const currentStageIdx = state.activeQuest.stage - 1;

    if (currentStageIdx < qDef.stages.length) {
      const stage = qDef.stages[currentStageIdx];

      let html = `
        <h4 style="color: var(--color-gold); margin-bottom: 0.5rem;">📜 Active Quest: ${qDef.name}</h4>
        <p style="font-size:0.9rem; margin-bottom: 0.8rem;"><strong>${stage.phaseName}:</strong> ${stage.text}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
      `;

      stage.choices.forEach((c, i) => {
        html += `<button class="btn btn--ghost btn--sm" id="btn-quest-choice-${i}">${c.label} [${c.stat.toUpperCase()}]</button>`;
      });
      html += `</div>`;
      boardSection.innerHTML = html;

      stage.choices.forEach((c, i) => {
        document.getElementById(`btn-quest-choice-${i}`).onclick = () => _resolveQuestStage(c.stat, c.dc, qDef.tier);
      });

    } else {
      boardSection.innerHTML = `
        <h4 style="color: var(--color-gold); margin-bottom: 0.5rem;">📜 Active Quest: ${qDef.name}</h4>
        <p style="font-size:0.9rem; margin-bottom: 0.8rem;"><strong>Final Phase:</strong> ${qDef.bossText}</p>
        <button class="btn btn--danger btn--full" id="btn-quest-fight">⚔️ Execute Final Confrontation</button>
      `;
      document.getElementById('btn-quest-fight').onclick = () => _finishQuest(qDef);
    }
  } else {
    // If the island is already cleared, show a generic message
    if (state.clearedIslands.includes(state.currentIsland)) {
      boardSection.innerHTML = `
          <h4 style="color: var(--color-gold); margin-bottom: 0.5rem;">📜 Tavern Job Board</h4>
          <p style="font-size:0.9rem; color: var(--color-text-muted);">The local boss has been dealt with. The port is safe, and the board is empty.</p>
        `;
      return;
    }

    const playerTier = Math.max(1, Math.ceil(state.level / 2));
    const availableQuests = QUESTS.filter(q => q.tier === playerTier || q.tier === playerTier - 1);

    let html = `<h4 style="color: var(--color-gold); margin-bottom: 0.5rem;">📜 Tavern Job Board</h4>`;

    availableQuests.forEach(q => {
      html += `
        <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:4px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:0.9rem;">${q.name} <span style="color:var(--color-text-muted); font-size:0.8rem;">(Tier ${q.tier})</span></strong>
            <div style="font-size:0.75rem; color:var(--color-text-muted);">Rewards: ${q.reward.gold} Gold, ${q.reward.exp} EXP</div>
          </div>
          <button class="btn btn--primary btn--sm" id="btn-accept-${q.id}">Accept</button>
        </div>
      `;
    });

    boardSection.innerHTML = html;

    availableQuests.forEach(q => {
      document.getElementById(`btn-accept-${q.id}`).onclick = () => {
        setActiveQuest({ id: q.id, stage: 1, modifiers: 0 });
        renderHub(getState());
      };
    });
  }
}

function _resolveQuestStage(stat, dc, tier) {
  const mod = getModifier(stat);
  const check = rollStatCheck(mod, 0, dc);

  if (check.success) {
    showToast(`🎲 Check Passed! (${check.total} vs DC ${dc}) Progressing with advantage!`, 'success');
  } else {
    const penalty = tier * 5;
    showToast(`🎲 Check Failed! (${check.total} vs DC ${dc}) Took ${penalty} DMG trying to proceed.`, 'danger');
    applyEventOutcome({ hp: -penalty });
  }

  incrementDay(); // Executing a quest phase takes a day
  advanceQuestStage();
  renderProfile(getState());
  renderHub(getState());
}

async function _finishQuest(qDef) {
  if (!window.GLD_NODES || !window.GLD_NODES.startQuestCombat) {
    console.error("[GLD] Combat system is not properly initialized.");
    return;
  }

  window.GLD_NODES.startQuestCombat(qDef.encounterKey, async () => {
    gainExp(qDef.reward.exp);
    applyEventOutcome({ gold: qDef.reward.gold });
    setActiveQuest(null);

    clearCurrentIsland(); // Unlocks the port
    chargeLogPose(3); // Instantly charges the Log Pose as a reward

    showToast(`💀 Target Neutralized! The port is open!`, 'gold');
    await savePlayer(toSaveObject());
    renderProfile(getState());
    renderHub(getState());
  });
}

// ── Asynchronous Crew Dispatch Board ──────────────────────────────────────

function _renderCrewDispatch(state) {
  const shipyardCard = document.getElementById('hub-shipyard');
  if (!shipyardCard) return;

  let dispatchSection = document.getElementById('crew-dispatch-board');
  if (!dispatchSection) {
    dispatchSection = document.createElement('div');
    dispatchSection.id = 'crew-dispatch-board';
    dispatchSection.style.borderTop = '1px dashed var(--border-color)';
    dispatchSection.style.marginTop = '1rem';
    dispatchSection.style.paddingTop = '1rem';
    shipyardCard.appendChild(dispatchSection);
  }

  const crew = getCrew();
  if (crew.length === 0) {
    dispatchSection.innerHTML = `<h4 style="color: var(--color-gold);">⚓ Crew Tasks</h4><p style="font-size:0.8rem; color:var(--color-text-muted);">No crew members available for asynchronous routing operations.</p>`;
    return;
  }

  let html = `<h4 style="color: var(--color-gold); margin-bottom:0.5rem;">⚓ Crew Dispatch Assignments</h4>`;
  crew.forEach(m => {
    const task = m.active_task;
    if (task) {
      const remaining = Math.max(0, new Date(task.ends_at) - new Date());
      if (remaining <= 0) {
        html += `
          <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:4px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>🟢 <strong>${m.name}</strong> completed assignment!</span>
            <button class="btn btn--primary btn--sm" data-claim-crew="${m.id}">Claim Loot</button>
          </div>
        `;
      } else {
        html += `
          <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:4px; margin-bottom:6px;">
            ⏳ <strong>${m.name}</strong> is executing [${task.name}] (${Math.ceil(remaining/1000)}s left)
          </div>
        `;
      }
    } else {
      html += `
        <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:4px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>⚪ <strong>${m.name}</strong> (Idle)</span>
          <select id="select-task-${m.id}" style="background:var(--color-bg-deep); color:white; border:1px solid var(--border-color); font-size:0.8rem;">
            ${DISPATCH_TASKS.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
          <button class="btn btn--ghost btn--sm" data-dispatch-crew="${m.id}">Go</button>
        </div>
      `;
    }
  });

  dispatchSection.innerHTML = html;

  dispatchSection.querySelectorAll('[data-dispatch-crew]').forEach(btn => {
    btn.onclick = () => {
      const crewId = btn.dataset.dispatchCrew;
      const taskType = document.getElementById(`select-task-${crewId}`).value;
      const taskDef = DISPATCH_TASKS.find(t => t.id === taskType);

      const targetCrew = crew.find(c => c.id === crewId);
      if (targetCrew) {
        targetCrew.active_task = {
          id: taskType,
          name: taskDef.name,
          ends_at: new Date(Date.now() + taskDef.duration).toISOString()
        };
        showToast(`${targetCrew.name} deployed. Timer running in background threads.`, 'info');
        renderHub(getState());
      }
    };
  });

  dispatchSection.querySelectorAll('[data-claim-crew]').forEach(btn => {
    btn.onclick = async () => {
      const crewId = btn.dataset.claimCrew;
      const targetCrew = crew.find(c => c.id === crewId);
      if (targetCrew) {
        targetCrew.active_task = null;
        applyEventOutcome({ gold: 50 });
        showToast(`Secure cargo secured from ${targetCrew.name}'s task! +50 Gold.`, 'success');
        await savePlayer(toSaveObject());
        renderProfile(getState());
        renderHub(getState());
      }
    };
  });
}

setInterval(() => {
  const currentScreen = document.querySelector('.screen.active');
  if (currentScreen && currentScreen.id === 'screen-game') {
    _renderCrewDispatch(getState());
  }
}, 2000);

// ── Bind Hub Core Actions ──────────────────────────────────────────────────

export function bindHubActions() {
  document.getElementById('tavern-rest-btn')?.addEventListener('click', async () => {
    const state = getState();
    if (state.hp >= state.maxHp) return;

    restoreHp(HUB_SERVICES.TAVERN.REST_HP_RESTORE);
    incrementDay(); // Resting takes a full day

    await savePlayer(toSaveObject());
    renderProfile(getState());
    renderHub(getState());
    showToast('😴 Rested for a day. HP restored.', 'success');
  });

  document.getElementById('tavern-recruit-btn')?.addEventListener('click', async () => {
    const state = getState();
    const cost = HUB_SERVICES.TAVERN.RECRUIT_COST;
    if (!spendGold(cost)) {
      showToast(`Not enough gold. Need ${cost}g.`, 'danger');
      return;
    }

    const success = Math.random() < DROP_RATES.CREW_RECRUIT_SUCCESS;
    if (!success) {
      await savePlayer(toSaveObject());
      renderProfile(getState());
      renderHub(getState());
      showToast('The recruits weren\'t impressed. Gold spent, crew not found.', 'danger');
      return;
    }

    const { data: available } = await fetchAvailableCrew(state.id);
    if (!available || available.length === 0) {
      showToast('You\'ve recruited everyone available in this port. Check back later.', 'info');
      return;
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    await recruitFromRoster(state.id, picked.id, state.day);

    const member = { ...picked, joined_day: state.day };
    addToCrewCache(member);

    await savePlayer(toSaveObject());
    renderProfile(getState());
    renderCrew();
    renderHub(getState());
    showToast(`🪝 ${picked.name} has joined the crew!`, 'gold');
  });

  document.getElementById('market-browse-btn')?.addEventListener('click', openMarket);
  document.getElementById('market-close-btn')?.addEventListener('click', () => {
    document.getElementById('market-overlay').hidden = true;
  });

  document.getElementById('shipyard-repair-btn')?.addEventListener('click', async () => {
    const state = getState();
    const hullMissing = state.shipHpMax - state.shipHp;
    const cost = hullMissing * HUB_SERVICES.SHIPYARD.REPAIR_COST_PER_HP;

    if (hullMissing <= 0 || !spendGold(cost)) return;
    repairShip(hullMissing);
    await savePlayer(toSaveObject());
    renderProfile(getState());
    renderHub(getState());
    showToast('⚙️ Ship hull successfully patched.', 'success');
  });
}

function openMarket() {
  const state = getState();
  document.getElementById('market-player-gold').textContent = state.gold.toLocaleString();
  const grid = document.getElementById('market-grid');
  grid.innerHTML = '';

  MARKET_ITEMS.forEach(item => {
    const slot = document.createElement('div');
    slot.style.aspectRatio = '1/1';
    slot.style.border = '1px solid var(--border-color, #444)';
    slot.style.borderRadius = '4px';
    slot.style.display = 'flex';
    slot.style.alignItems = 'center';
    slot.style.justifyContent = 'center';
    slot.style.fontSize = '2rem';
    slot.style.background = 'rgba(255,255,255,0.05)';
    slot.style.cursor = 'pointer';
    slot.innerHTML = `<span>${item.icon}</span>`;
    slot.onclick = () => showMarketItemDetails(item);
    grid.appendChild(slot);
  });

  document.getElementById('market-overlay').hidden = false;
}

function showMarketItemDetails(item) {
  const details = document.getElementById('market-details');
  if (!item) return;

  const canAfford = getState().gold >= item.cost;

  details.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 3rem;">${item.icon}</span>
          <div>
            <h4 style="margin: 0; font-size: 1.2rem; color: var(--gold, #d4af37);">${item.name}</h4>
            <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-muted);">${item.type}</div>
          </div>
      </div>
      <p style="margin-bottom: 2rem;">${item.description}</p>
      <button class="btn btn--primary btn--full" id="btn-buy-item" ${canAfford ? '' : 'disabled'}>Buy — ${item.cost} Gold</button>
  `;

  document.getElementById('btn-buy-item').onclick = async () => {
    if (!spendGold(item.cost)) return;
    addInventoryItem({ ...item, instanceId: crypto.randomUUID() });
    await savePlayer(toSaveObject());
    renderProfile(getState());
    openMarket();
    showToast(`Purchased ${item.name}`, 'gold');
  };
}