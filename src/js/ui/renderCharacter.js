// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderCharacter.js
//  Profile sidebar, dynamic Skills UI, and Crew rendering.
// ═══════════════════════════════════════════════════════════════════════════

import { SEAS, CLASSES, LEVEL_THRESHOLDS } from '../config/gameData.js';
import { getCrew } from '../engine/crewState.js';

// ── Profile Sidebar ───────────────────────────────────────────────────────

export function renderProfile(state) {
  _setText('profile-name', state.name);
  _setText('profile-sea',  `🌊 ${_seaLabel(state.seaOfOrigin)}`);

  const nextExp = LEVEL_THRESHOLDS[state.level] || 'MAX';
  _setText('profile-level', `Lvl ${state.level}`);
  _setText('profile-exp', `${state.exp} / ${nextExp} EXP`);

  _setText('profile-gold', state.gold.toLocaleString());
  _setText('profile-bounty', state.bounty.toLocaleString());
  _setText('profile-food', state.food?.toLocaleString() ?? 0);
  _setText('profile-cola', state.cola?.toLocaleString() ?? 0);
  _setText('profile-day',  state.day);
  _setText('profile-log-pose', state.logPoseCharge ?? 0);
  _setText('profile-hp',   `${state.hp} / ${state.maxHp}`);
  _setText('profile-ship-hp', `${state.shipHp} / ${state.shipHpMax}`);

  // ── Interactive Stat Grid ──
  const statsList = document.getElementById('combat-stats-list');
  if (statsList && state.attributes) {
    const points = state.statPoints || 0;
    const showPlus = points > 0;

    // Style the UL to act as a grid container
    statsList.style.display = 'grid';
    statsList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';
    statsList.style.gap = '10px';
    statsList.style.padding = '0';
    statsList.style.margin = '0 0 1.5rem 0';
    statsList.style.listStyle = 'none';

    let html = ``;

    if (showPlus) {
      html += `
        <li style="grid-column: 1 / -1; background: rgba(76, 175, 114, 0.15); color: var(--color-success); padding: 8px 12px; border-radius: 6px; text-align: center; border: 1px solid var(--color-success); font-weight: bold; margin-bottom: 4px; box-shadow: 0 0 8px rgba(76, 175, 114, 0.2);">
            ✨ Available Stat Points: ${points}
        </li>`;
    }

    const statDefs = [
      { key: 'str', icon: '💪', label: 'STR', title: 'Strength: Increases melee damage, carrying capacity, and athletics.' },
      { key: 'dex', icon: '🏃', label: 'DEX', title: 'Dexterity: Increases Armor Class, ranged damage, and agility.' },
      { key: 'con', icon: '🛡️', label: 'CON', title: 'Constitution: Increases Maximum HP and resilience against poisons.' },
      { key: 'int', icon: '🧠', label: 'INT', title: 'Intelligence: Boosts tech skills, investigation, and strategic logic.' },
      { key: 'wis', icon: '🦉', label: 'WIS', title: 'Wisdom: Enhances perception, survival, and intuition.' },
      { key: 'cha', icon: '✨', label: 'CHA', title: 'Charisma: Improves leadership, persuasion, and deception.' }
    ];

    statDefs.forEach(s => {
      const val = state.attributes[s.key];

      // Calculate the D&D Modifier dynamically for the UI
      let modBase = val;
      if (state.equipment?.accessory?.attributeBuffs?.[s.key]) {
        modBase += state.equipment.accessory.attributeBuffs[s.key];
      }
      const mod = Math.floor((modBase - 10) / 2);
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
      const modColor = mod >= 0 ? '#4caf72' : '#ff6b6b';

      html += `
        <li title="${s.title}" style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center; cursor: help; transition: border-color 0.2s ease;">
            <div style="display: flex; flex-direction: column;">
                <span style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">${s.icon} ${s.label}</span>
                <div style="display: flex; align-items: baseline; gap: 6px; margin-top: 2px;">
                    <span style="font-size: 1.4rem; color: var(--color-gold); font-weight: bold;">${val}</span>
                    <span style="font-size: 0.85rem; color: ${modColor}; font-weight: bold;">(${modStr})</span>
                </div>
            </div>
            ${showPlus ? `<button class="btn btn--primary stat-plus-btn" data-stat="${s.key}" style="padding: 0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; line-height: 1;">+</button>` : ''}
        </li>
        `;
    });

    const totalSpent = Object.values(state.spentPoints || {}).reduce((a, b) => a + b, 0);
    if (totalSpent > 0) {
      html += `
      <li style="grid-column: 1 / -1; margin-top: 4px;">
          <button class="btn btn--ghost btn--full" id="btn-reset-stats" style="border-color: rgba(255, 107, 107, 0.5); color: var(--color-danger); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em;">🔄 Reset Allocated Stats</button>
      </li>`;
    }

    statsList.innerHTML = html;

    // Bind [+] allocation buttons
    document.querySelectorAll('.stat-plus-btn').forEach(btn => {
      btn.onclick = async () => {
        const stat = btn.dataset.stat;
        const { allocateStatPoint, toSaveObject, getState } = await import('../engine/playerState.js');
        const { savePlayer } = await import('../supabase/client.js');

        if (allocateStatPoint(stat)) {
          await savePlayer(toSaveObject());
          renderProfile(getState());
        }
      };
    });

    // Bind Reset button
    const resetBtn = document.getElementById('btn-reset-stats');
    if (resetBtn) {
      resetBtn.onclick = async () => {
        if (confirm("Reset all allocated points? Your Maximum HP will be recalculated.")) {
          const { resetStats, toSaveObject, getState } = await import('../engine/playerState.js');
          const { savePlayer } = await import('../supabase/client.js');

          resetStats();
          await savePlayer(toSaveObject());
          renderProfile(getState());
        }
      };
    }
  }

  // ── Stat Bars ──
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
    const roleCfg = CLASSES[state.role];
    styleBadge.textContent = roleCfg ? `${roleCfg.icon} ${roleCfg.label}` : state.role;
    styleBadge.className   = `profile-panel__badge badge--${(state.role || 'captain').toLowerCase()}`;
  }

  // ── Inject Skills UI ──
  let skillsContainer = document.getElementById('player-skills-container');
  if (!skillsContainer) {
    const captainPanel = document.getElementById('panel-captain');
    skillsContainer = document.createElement('div');
    skillsContainer.id = 'player-skills-container';
    skillsContainer.className = 'skills-section';
    skillsContainer.style.marginTop = '1rem';

    const dfSection = document.getElementById('devil-fruit-section');
    if (captainPanel && dfSection) {
      captainPanel.insertBefore(skillsContainer, dfSection);
    }
  }

  const roleCfg = CLASSES[state.role] || CLASSES['CAPTAIN'];
  const profs = roleCfg.proficiencies.map(p => p.toUpperCase()).join(', ');

  let skillsHtml = `
    <h4 style="color: var(--color-gold); margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Class Skills & Proficiencies</h4>
    <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--color-border); border-radius: 6px; padding: 10px; margin-bottom: 1rem;">
      <ul style="list-style: none; padding: 0; font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
        <li style="margin-bottom: 6px;"><strong>Saves:</strong> ${profs}</li>
  `;

  if (state.skills && state.skills.length > 0) {
    state.skills.forEach(skill => {
      skillsHtml += `<li style="margin-bottom: 4px; color: #fff;">✨ ${skill}</li>`;
    });
  } else {
    skillsHtml += `<li><em>No active skills unlocked yet.</em></li>`;
  }
  skillsHtml += `</ul></div>`;
  skillsContainer.innerHTML = skillsHtml;

  // ── Devil Fruit Section ──
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
    crewList.innerHTML = '<li class="crew-list__empty" style="text-align: center; padding: 2rem 0; color: var(--color-text-muted);">No crew recruited yet.</li>';
    return;
  }

  crewList.innerHTML = members.map(m => {
    const roleKey = m.role || m.combat_style || 'CAPTAIN';
    const roleCfg = CLASSES[roleKey] || CLASSES['CAPTAIN'];
    const safeAttributes = m.attributes?.str ? m.attributes : roleCfg.baseAttributes;

    const mLevel = m.level || 1;
    const conMod = Math.floor((safeAttributes.con - 10) / 2);
    const properMaxHp = Math.max(1, (roleCfg.hitDie + conMod)) * mLevel;
    const displayHp = Math.min(m.hp || properMaxHp, properMaxHp);

    return `
      <li class="crew-list__member" style="background: rgba(0,0,0,0.2); border: 1px solid var(--color-border); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
        <div class="crew-member__identity" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 8px;">
          <span class="crew-member__icon" style="font-size: 1.5rem;">${roleCfg.icon}</span>
          <div class="crew-member__info">
            <span class="crew-member__name" style="font-weight: bold; font-size: 1.1rem; color: var(--color-gold);">${m.name} <small style="color: var(--color-text-muted); font-size: 0.8rem;">(Lvl ${mLevel})</small></span>
            <span class="crew-member__style" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">${roleCfg.label}</span>
          </div>
          <span class="crew-member__day" style="font-size: 0.75rem; color: var(--color-text-muted);">Joined Day ${m.joined_day || 1}</span>
        </div>
        <div class="crew-member__stats dnd-stats-row" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 0.8rem; color: var(--color-text-muted); text-align: center; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px;">
          <span title="Strength">STR <strong style="color: #fff;">${safeAttributes.str}</strong></span>
          <span title="Dexterity">DEX <strong style="color: #fff;">${safeAttributes.dex}</strong></span>
          <span title="Constitution">CON <strong style="color: #fff;">${safeAttributes.con}</strong></span>
          <span title="Intelligence">INT <strong style="color: #fff;">${safeAttributes.int}</strong></span>
          <span title="Wisdom">WIS <strong style="color: #fff;">${safeAttributes.wis}</strong></span>
          <span title="Charisma">CHA <strong style="color: #fff;">${safeAttributes.cha}</strong></span>
        </div>
        <div class="crew-member__sub-stats" style="margin-top: 8px; font-size: 0.85rem; display: flex; justify-content: space-between;">
          <span title="Hit Points">❤️ <strong style="color: ${displayHp < properMaxHp * 0.3 ? '#ff6b6b' : '#fff'};">${displayHp} / ${properMaxHp}</strong></span>
          <span title="Bounty" class="crew-member__bounty" style="color: var(--color-gold);">💰 ${(m.bounty ?? 0).toLocaleString()}</span>
        </div>
      </li>
    `;
  }).join('');
}

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