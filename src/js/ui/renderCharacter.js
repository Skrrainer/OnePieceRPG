// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderCharacter.js
//  Character creation form logic and profile sidebar rendering.
// ═══════════════════════════════════════════════════════════════════════════

import { SEAS, COMBAT_STYLES, STARTING_GOLD, DEVIL_FRUITS } from '../config/gameData.js';
import { pickSpawnIsland, getSeaForIsland } from '../../config/islands.js';
import { getCrew, setCrew } from '../engine/crewState.js';
import { assignSea } from '../engine/rng.js';
import { initState, getState, toSaveObject } from '../engine/playerState.js';
import { savePlayer, authenticatePlayer } from '../supabase/client.js';
import { switchScreen } from '../main.js';
import { showToast } from './renderEvents.js';
import { renderHub } from './renderHub.js';
import { initInlineMap } from './renderMap.js';

// ── Authentication & Creation Form ─────────────────────────────────────────

export function initCreationForm() {
  const loginForm     = document.getElementById('login-form');
  const registerForm  = document.getElementById('register-form');
  const tabLogin      = document.getElementById('tab-login');
  const tabRegister   = document.getElementById('tab-register');
  const seaDisplay    = document.getElementById('sea-fate-display');
  const registerBtn   = document.getElementById('register-btn');

  // ── Tab Switching ──
  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.hidden = false;
    registerForm.hidden = true;
  });

  tabRegister?.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.hidden = false;
    loginForm.hidden = true;
  });

  // ── Teaser ──
  registerBtn?.addEventListener('mouseenter', () => {
    const teaser = assignSea(SEAS);
    if (seaDisplay) seaDisplay.textContent = `Perhaps... ${teaser.label}?`;
  });
  registerBtn?.addEventListener('mouseleave', () => {
    if (seaDisplay) seaDisplay.textContent = '— Assigned by fate upon embarkation —';
  });

  // ── Registration (New Voyage) ──
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('register-error');
    _clearError(errorBox);

    const nameInput  = registerForm.querySelector('#pirate-name');
    const passInput  = registerForm.querySelector('#pirate-pass');
    const styleInput = registerForm.querySelector('input[name="combatStyle"]:checked');

    const name = nameInput?.value.trim();
    const passcode = passInput?.value.trim();

    if (!name || name.length < 1) return _showError(errorBox, 'A pirate without a name is just a ghost. Enter yours.');
    if (!passcode || passcode.length < 3) return _showError(errorBox, 'Enter a secure passcode (at least 3 characters).');
    if (!styleInput) return _showError(errorBox, 'Choose your Combat Style before embarking.');

    const styleKey = styleInput.value;
    const style    = COMBAT_STYLES[styleKey];
    if (!style) return _showError(errorBox, 'Unknown combat style.');

    // Pick a spawn island first, then derive the sea from its location
    const spawnIsland = pickSpawnIsland();
    const spawnSeaId  = getSeaForIsland(spawnIsland);
    const sea         = (spawnSeaId ? SEAS.find(s => s.id === spawnSeaId) : null) ?? assignSea(SEAS);
    const baseAttack   = 5 + style.statBonuses.attack   + (sea.passiveModifiers?.attack   ?? 0);
    const baseDefense  = 5 + style.statBonuses.defense  + (sea.passiveModifiers?.defense  ?? 0);
    const baseAccuracy = 5 + style.statBonuses.accuracy + (sea.passiveModifiers?.accuracy ?? 0);
    const baseHP       = style.baseHP;
    const baseShipHP   = style.baseShipHP;

    initState({
      name,
      combatStyle:    styleKey,
      seaOfOrigin:    sea,
      day:            1,
      hp:             baseHP,
      maxHp:          baseHP,
      gold:           STARTING_GOLD,
      bounty:         0,
      shipHp:         baseShipHP,
      shipHpMax:      baseShipHP,
      attack:         baseAttack,
      defense:        baseDefense,
      accuracy:       baseAccuracy,
      startingItem:   style.startingItem,
      passcode:       passcode,
      currentIsland:  spawnIsland.id,
    });

    const freshState = getState();
    registerBtn.disabled = true;
    registerBtn.textContent = '⚓ Setting sail...';

    // Get cleanly mapped object for Supabase to avoid inserting non-existent columns
    const savePayload = toSaveObject();

    const { error, data } = await savePlayer(savePayload);

    if (error && error.code === '23505') {
      // Unique violation
      registerBtn.disabled = false;
      registerBtn.textContent = '⚓ Embark';
      return _showError(errorBox, 'That pirate name is already taken. The sea only knows one.');
    } else if (error && error.message !== 'Supabase not configured') {
      console.warn('[GLD] Could not persist new player:', error.message);
      showToast('⚠️ Running offline — progress may not be saved.', 'danger');
      registerBtn.disabled = false;
      registerBtn.textContent = '⚓ Embark';
      // Fallback to local mode so they can still play
      localStorage.setItem('gld_player_id', freshState.id);
    } else {
      localStorage.setItem('gld_player_id', data ? data.id : freshState.id);
    }

    _transitionToGame(freshState);
  });

  // ── Login (Resume Voyage) ──
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');
    _clearError(errorBox);

    const nameInput = loginForm.querySelector('#login-name');
    const passInput = loginForm.querySelector('#login-pass');

    const name = nameInput?.value.trim();
    const passcode = passInput?.value.trim();

    if (!name || !passcode) return _showError(errorBox, 'Please enter both name and passcode.');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Searching records...';

    const encodedPasscode = btoa(passcode);
    const { data, error } = await authenticatePlayer(name, encodedPasscode);

    if (error || !data) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Resume Voyage';
      return _showError(errorBox, 'Invalid credentials. The logbook rejects you.');
    }

    localStorage.setItem('gld_player_id', data.id);

    const seaObj   = SEAS.find(s => s.id === data.sea_of_origin) ?? null;
    const fruitObj = data.has_fruit && data.devil_fruit
        ? DEVIL_FRUITS.find(f => f.id === data.devil_fruit) ?? null
        : null;

    initState({
      ...data,
      seaOfOrigin:  seaObj,
      combatStyle:  data.combat_style,
      maxHp:        data.max_hp,
      shipHp:       data.ship_hp,
      shipHpMax:    data.ship_hp_max,
      hasFruit:     data.has_fruit,
      devilFruit:   fruitObj,
      passcode:     passcode,
      bounty:       data.bounty ?? 0,
    });

    const state = getState();
    showToast(`⚓ Welcome back, ${state.name}!`, 'gold');
    _transitionToGame(state);
  });
}

function _transitionToGame(state) {
  document.getElementById('logout-btn').hidden = false;
  renderProfile(state);
  setCrew([]); // new player starts with no crew
  renderCrew();
  renderHub(state);
  switchScreen('screen-game');
  _updateHubDay(state.day);
  initInlineMap();
}

// ── Profile Sidebar ───────────────────────────────────────────────────────

export function renderProfile(state) {
  _setText('profile-name', state.name);
  _setText('profile-sea',  `🌊 ${_seaLabel(state.seaOfOrigin)}`);
  _setText('profile-gold', state.gold.toLocaleString());
  _setText('profile-bounty', state.bounty.toLocaleString());
  _setText('profile-day',  state.day);
  _setText('profile-hp',   `${state.hp} / ${state.maxHp}`);
  _setText('profile-ship-hp', `${state.shipHp} / ${state.shipHpMax}`);
  _setText('stat-attack',   state.attack);
  _setText('stat-defense',  state.defense);
  _setText('stat-accuracy', state.accuracy);

  const hpBar = document.getElementById('stat-bar-hp');
  if (hpBar) {
    const pct = Math.max(0, Math.round((state.hp / state.maxHp) * 100));
    hpBar.style.width = `${pct}%`;
    hpBar.style.filter = pct < 25 ? 'hue-rotate(0deg) saturate(2)' : '';
  }

  const shipBar = document.getElementById('stat-bar-ship');
  if (shipBar) {
    const pct = Math.max(0, Math.round((state.shipHp / state.shipHpMax) * 100));
    shipBar.style.width = `${pct}%`;
  }

  const styleBadge = document.getElementById('profile-style-badge');
  if (styleBadge) {
    const styleCfg = COMBAT_STYLES[state.combatStyle];
    styleBadge.textContent = styleCfg?.label ?? state.combatStyle;
    styleBadge.className   = `profile-panel__badge ${styleCfg?.cssClass ?? ''}`;
  }

  const dfSection = document.getElementById('devil-fruit-section');
  if (dfSection) {
    if (state.hasFruit && state.devilFruit) {
      dfSection.hidden = false;
      _setText('devil-fruit-name',    state.devilFruit.name);
      _setText('devil-fruit-type',    state.devilFruit.type);
      _setText('devil-fruit-ability', state.devilFruit.ability);
      document.documentElement.style.setProperty('--df-glow-color', state.devilFruit.glowColor ?? '#9b7fd4');
      document.body.classList.add('df-active', state.devilFruit.cssClass ?? 'df-paramecia');
    } else {
      dfSection.hidden = true;
    }
  }

  _updateHubDay(state.day);
  _setText('ship-hp-display',     state.shipHp);
  _setText('ship-hp-max-display', state.shipHpMax);

  renderCrew();
}

/**
 * Renders the crew list in the Captain tab from the local crew cache.
 * Call this any time the crew changes.
 */
export function renderCrew() {
  const crewList  = document.getElementById('crew-list');
  const crewCount = document.getElementById('crew-count');
  if (!crewList) return;

  const members = getCrew();
  if (crewCount) crewCount.textContent = members.length;

  if (members.length === 0) {
    crewList.innerHTML = '<li class="crew-list__empty">No crew recruited yet.</li>';
    return;
  }

  const STYLE_ICON = { BRAWLER: '👊', SWORDSMAN: '⚔️', SNIPER: '🎯' };

  crewList.innerHTML = members.map(m => `
    <li class="crew-list__member">
      <div class="crew-member__identity">
        <span class="crew-member__icon">${STYLE_ICON[m.combat_style] ?? '🏴‍☠️'}</span>
        <div class="crew-member__info">
          <span class="crew-member__name">${m.name}</span>
          <span class="crew-member__style">${m.combat_style}</span>
        </div>
        <span class="crew-member__day">Day ${m.joined_day}</span>
      </div>
      <div class="crew-member__stats">
        <span title="Attack">⚔️ ${m.attack}</span>
        <span title="Defense">🛡️ ${m.defense}</span>
        <span title="Accuracy">🎯 ${m.accuracy}</span>
        <span title="HP">❤️ ${m.hp}/${m.max_hp}</span>
        <span title="Bounty" class="crew-member__bounty">💰 ${(m.bounty ?? 0).toLocaleString()}</span>
      </div>
    </li>
  `).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function _seaLabel(seaOfOrigin) {
  if (!seaOfOrigin) return '—';
  if (typeof seaOfOrigin === 'object') return seaOfOrigin.label ?? seaOfOrigin.id;
  const found = SEAS.find(s => s.id === seaOfOrigin);
  return found?.label ?? seaOfOrigin;
}

function _updateHubDay(day) {
  _setText('hub-day', `Day ${day}`);
}

function _showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.hidden      = false;
}

function _clearError(el) {
  if (!el) return;
  el.textContent = '';
  el.hidden      = true;
}