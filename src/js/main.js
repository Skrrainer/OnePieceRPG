// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — main.js
//  Entry point. Wires all modules together. Contains zero business logic.
// ═══════════════════════════════════════════════════════════════════════════

import { loadPlayer, checkDbReady, loadPlayerCrew, fetchAllIslands } from './supabase/client.js';
import { loadIslands }              from '../config/islands.js';
import { initState, getState }      from './engine/playerState.js';
import { setCrew }                  from './engine/crewState.js';
import { sailDay }                 from './engine/gameLoop.js';
import { renderProfile, renderCrew } from './ui/renderCharacter.js';
import { initAuthForms }           from './ui/renderAuth.js';
import { showToast }               from './ui/renderEvents.js';
import { renderHub, bindHubActions } from './ui/renderHub.js';
import { initInlineMap, renderInlineMapMarkers } from './ui/renderMap.js';
import { initInventory }           from './ui/renderInventory.js';
import { SEAS, DEVIL_FRUITS }      from './config/gameData.js';
import './ui/renderIslandNodes.js';

export function switchScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => {
    const isTarget = s.id === screenId;
    s.hidden = !isTarget;
    s.classList.toggle('active', isTarget);
  });
}

async function bootstrap() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[GLD] SW registered:', reg.scope);
    } catch (err) {
      console.warn('[GLD] SW registration failed:', err);
    }
  }

  // ── FIX: Remove old Log Tab and gracefully fill the remaining space ──
  const logTab = document.querySelector('.sidebar-tab[data-tab="log"]');
  if (logTab) {
    const parent = logTab.parentElement;
    logTab.remove();
    // Force remaining tabs to stretch and fill the space evenly
    parent.style.display = 'flex';
    Array.from(parent.children).forEach(child => {
      child.style.flex = '1';
      child.style.textAlign = 'center';
    });
  }
  document.getElementById('panel-log')?.remove();
  // ───────────────────────────────────────────────────────────────────────

  const dbReady = await checkDbReady();

  if (!dbReady) {
    showToast('⚠️ DB tables missing. Playing offline.', 'danger', 8000);
  } else {
    const { data: islandsData } = await fetchAllIslands();
    loadIslands(islandsData || []);
  }

  const savedId = localStorage.getItem('gld_player_id');
  let restoredPlayer = null;

  if (dbReady && savedId) {
    const { data } = await loadPlayer(savedId);
    if (data) restoredPlayer = data;
    else localStorage.removeItem('gld_player_id');
  }

  initAuthForms();
  bindHubActions();
  initInventory();
  _bindSailButton();
  _bindModalClose();
  _bindLogoutButton();
  _bindSidebarTabs();

  if (restoredPlayer) {
    const seaObj   = SEAS.find(s => s.id === restoredPlayer.sea_of_origin) ?? null;
    const fruitObj = restoredPlayer.has_fruit && restoredPlayer.devil_fruit
        ? DEVIL_FRUITS.find(f => f.id === restoredPlayer.devil_fruit) ?? null
        : null;

    initState({
      ...restoredPlayer,
      seaOfOrigin:  seaObj,
      combatStyle:  restoredPlayer.combat_style,
      maxHp:        restoredPlayer.max_hp,
      shipHp:       restoredPlayer.ship_hp,
      shipHpMax:    restoredPlayer.ship_hp_max,
      hasFruit:     restoredPlayer.has_fruit,
      devilFruit:   fruitObj,
    });

    const state = getState();
    renderProfile(state);

    const { data: crewData } = await loadPlayerCrew(state.id);
    setCrew(crewData ?? []);
    renderCrew();

    renderHub(state);
    document.getElementById('logout-btn').hidden = false;
    switchScreen('screen-game');
    initInlineMap();
    showToast(`⚓ Welcome back, ${state.name}!`, 'gold');
  } else {
    document.getElementById('logout-btn').hidden = true;
    switchScreen('screen-auth');
  }
}

function _bindSailButton() {
  const sailBtn = document.getElementById('set-sail-btn');
  if (!sailBtn) return;

  sailBtn.addEventListener('click', async () => {
    sailBtn.disabled = true;
    const destinationId = sailBtn.dataset.destination;
    sailBtn.textContent = '🌊 Sailing...';

    switchSidebarTab('map');

    try {
      await sailDay(destinationId);
    } catch (err) {
      console.error('[GLD] sailDay error:', err);
      showToast('⚠️ Something went wrong at sea.', 'danger');
    } finally {
      sailBtn.disabled = false;
      sailBtn.textContent = '🧭 Select a Destination';
      delete sailBtn.dataset.destination;
      document.querySelectorAll('.island-btn').forEach(b => b.classList.remove('selected'));
      renderHub(getState());
      renderInlineMapMarkers();

      switchSidebarTab('hub');
    }
  });
}

function _bindLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if(!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('gld_player_id');
    setCrew([]);
    renderCrew();
    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();
    document.body.classList.remove('df-active', 'df-paramecia', 'df-zoan', 'df-logia');
    document.documentElement.style.removeProperty('--df-glow-color');
    document.getElementById('devil-fruit-section').hidden = true;
    logoutBtn.hidden = true;
    switchScreen('screen-auth');
    showToast('Signed out successfully.', 'info');
  });
}

export function switchSidebarTab(tabId) {
  document.querySelectorAll('.sidebar-tab').forEach(t => {
    const active = t.dataset.tab === tabId;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.sidebar-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabId}`);
  });
  const isMobile = window.matchMedia('(max-width: 899px)').matches;
  if (isMobile) {
    document.getElementById('game-sidebar')?.classList.add('sidebar--open');
  }
}

function _bindSidebarTabs() {
  const sidebar = document.getElementById('game-sidebar');
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab  = tab.dataset.tab;
      const isMobile   = window.matchMedia('(max-width: 899px)').matches;
      const wasActive  = tab.classList.contains('active');
      const sheetOpen  = sidebar?.classList.contains('sidebar--open');

      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));

      if (isMobile && wasActive && sheetOpen) {
        sidebar.classList.remove('sidebar--open');
      } else {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.getElementById(`panel-${targetTab}`)?.classList.add('active');
        if (isMobile) sidebar?.classList.add('sidebar--open');
      }
    });
  });
}

function _bindModalClose() {
  const overlay  = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn?.addEventListener('click', () => {
    if (overlay) overlay.hidden = true;
  });
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
}

export function openModal({ title, body, footer = '' }) {
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const bodyEl  = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  if (!overlay) return;
  if (titleEl)  titleEl.textContent  = title;
  if (bodyEl)   bodyEl.innerHTML     = body;
  if (footerEl) footerEl.innerHTML   = footer;
  overlay.hidden = false;
}

document.addEventListener('DOMContentLoaded', bootstrap);