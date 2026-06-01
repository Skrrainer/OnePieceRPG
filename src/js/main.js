// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — main.js
//  Entry point. Wires all modules together. Contains zero business logic.
// ═══════════════════════════════════════════════════════════════════════════

import { loadPlayer, checkDbReady, loadPlayerCrew } from './supabase/client.js';
import { initState, getState }      from './engine/playerState.js';
import { setCrew }                  from './engine/crewState.js';
import { sailDay }                 from './engine/gameLoop.js';
import { renderProfile, renderCrew } from './ui/renderCharacter.js';
import { initAuthForms }           from './ui/renderAuth.js';
import { clearLog, showToast }     from './ui/renderEvents.js';
import { renderHub, bindHubActions } from './ui/renderHub.js';
import { initInlineMap, renderInlineMapMarkers } from './ui/renderMap.js';
import { initInventory }           from './ui/renderInventory.js';
import { SEAS, DEVIL_FRUITS }      from './config/gameData.js';

// Initialize the Island Nodes module to attach window.GLD_NODES
import './ui/renderIslandNodes.js';

// ── Screen Navigation ─────────────────────────────────────────────────────

/**
 * Activates a screen by id, hides all others, and syncs nav buttons.
 * Exported so other modules can trigger transitions.
 * @param {string} screenId – e.g. 'screen-game'
 */
export function switchScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => {
    const isTarget = s.id === screenId;
    s.hidden = !isTarget;
    s.classList.toggle('active', isTarget);
  });
}

// ── App Bootstrap ─────────────────────────────────────────────────────────

async function bootstrap() {
  // ── 1. Register Service Worker (production only) ─────────────────────────
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[GLD] SW registered:', reg.scope);
    } catch (err) {
      console.warn('[GLD] SW registration failed:', err);
    }
  }

  // ── 2. Check DB is ready, then attempt to load saved player ──────────────
  const dbReady = await checkDbReady();

  if (!dbReady) {
    showToast('⚠️ DB tables missing — run supabase/schema.sql in your Supabase SQL Editor. Playing offline.', 'danger', 8000);
  }

  const savedId = localStorage.getItem('gld_player_id');
  let restoredPlayer = null;

  if (dbReady && savedId) {
    const { data, error } = await loadPlayer(savedId);
    if (data) {
      restoredPlayer = data;
    } else {
      // Player UUID in localStorage is stale (DB was reset, or row deleted)
      localStorage.removeItem('gld_player_id');
    }
  }

  // ── 3. Initialise modules ─────────────────────────────────────────────────
  initAuthForms();
  bindHubActions();
  initInventory();
  _bindSailButton();
  _bindClearLogButton();
  _bindModalClose();
  _bindLogoutButton();
  _bindSidebarTabs();

  // ── 4. Route to correct screen ────────────────────────────────────────────
  if (restoredPlayer) {
    // Rehydrate: map Supabase flat row → rich state with sea/fruit objects
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

    // Load crew from Supabase and populate cache
    const { data: crewData } = await loadPlayerCrew(state.id);
    setCrew(crewData ?? []);
    renderCrew();

    renderHub(state);
    document.getElementById('logout-btn').hidden = false;
    switchScreen('screen-game');
    initInlineMap();
    showToast(`⚓ Welcome back, ${state.name}!`, 'gold');
  } else {
    // Fresh start — auth screen
    document.getElementById('logout-btn').hidden = true;
    switchScreen('screen-auth');
  }
}

// ── Event Bindings ────────────────────────────────────────────────────────

function _bindSailButton() {
  const sailBtn = document.getElementById('set-sail-btn');
  if (!sailBtn) return;

  sailBtn.addEventListener('click', async () => {
    sailBtn.disabled    = true;
    const destinationId = sailBtn.dataset.destination;
    sailBtn.textContent = '🌊 Sailing...';

    // Scroll to event log so user sees what happens
    document.getElementById('event-log')?.scrollIntoView({ behavior: 'smooth' });

    try {
      // Pass destinationId into sailDay to implement destination logic
      await sailDay(destinationId);
    } catch (err) {
      console.error('[GLD] sailDay error:', err);
      showToast('⚠️ Something went wrong at sea.', 'danger');
    } finally {
      sailBtn.disabled    = false;
      sailBtn.textContent = '🧭 Select a Destination'; // Changed back to log pose state
      delete sailBtn.dataset.destination;
      // Reset selected buttons
      document.querySelectorAll('.island-btn').forEach(b => b.classList.remove('selected'));
      renderHub(getState());
      renderInlineMapMarkers();
      // Switch to log tab so the voyage events are immediately visible
      switchSidebarTab('log');
    }
  });
}

function _bindClearLogButton() {
  document.getElementById('clear-log-btn')?.addEventListener('click', clearLog);
}

function _bindLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if(!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('gld_player_id');
    // Clear crew cache
    setCrew([]);
    renderCrew();
    // Reset forms
    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();

    // Clear state specific UI
    document.body.classList.remove('df-active', 'df-paramecia', 'df-zoan', 'df-logia');
    document.documentElement.style.removeProperty('--df-glow-color');
    document.getElementById('devil-fruit-section').hidden = true;

    // Reset log
    clearLog();

    // Switch screens
    logoutBtn.hidden = true;
    switchScreen('screen-auth');
    showToast('Signed out successfully.', 'info');
  });
}


/**
 * Switches the active sidebar tab programmatically.
 * Also opens the mobile sheet if on a small viewport.
 * @param {string} tabId – matches data-tab attribute (e.g. 'log', 'nav')
 */
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

      // Deactivate all tabs and panels
      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));

      if (isMobile && wasActive && sheetOpen) {
        // Tap active tab again → close the sheet
        sidebar.classList.remove('sidebar--open');
      } else {
        // Activate selected tab
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

// ── Modal Utility (exported for use by other modules) ─────────────────────

/**
 * Opens the global modal with custom content.
 * @param {{ title: string, body: string, footer?: string }} opts
 */
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

// ── Kick off ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);