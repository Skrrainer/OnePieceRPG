// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderCharacter.js
//  Profile sidebar and crew rendering.
// ═══════════════════════════════════════════════════════════════════════════

import { SEAS, COMBAT_STYLES } from '../config/gameData.js';
import { getCrew } from '../engine/crewState.js';

// ── Profile Sidebar ───────────────────────────────────────────────────────

export function renderProfile(state) {
  _setText('profile-name', state.name);
  _setText('profile-sea',  `🌊 ${_seaLabel(state.seaOfOrigin)}`);
  _setText('profile-gold', state.gold.toLocaleString());
  _setText('profile-bounty', state.bounty.toLocaleString());
  _setText('profile-food', state.food?.toLocaleString() ?? 0);
  _setText('profile-cola', state.cola?.toLocaleString() ?? 0);
  _setText('profile-day',  state.day);
  _setText('profile-log-pose', state.logPoseCharge ?? 0);
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

  updateHubDay(state.day);
  _setText('ship-hp-display',     state.shipHp);
  _setText('ship-hp-max-display', state.shipHpMax);

  renderCrew();
}

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

export function updateHubDay(day) {
  _setText('hub-day', `Day ${day}`);
}