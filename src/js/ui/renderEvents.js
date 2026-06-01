// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderEvents.js
//  Voyage event log rendering and interactive choices system.
// ═══════════════════════════════════════════════════════════════════════════

import { getState, applyEventOutcome, toSaveObject, isDead, addInventoryItem, modifyFood, modifyCola, chargeLogPose } from '../engine/playerState.js';
import { savePlayer } from '../supabase/client.js';

/**
 * Renders a list of resolved voyage events into the #event-log container.
 * Each event is prepended (newest at top).
 *
 * @param {Array}       events    – array of event objects
 * @param {Object|null} fruitDrop – Devil Fruit object from gameData, or null
 * @param {number}      day       – current voyage day (for log timestamps)
 */
export function renderEvents(events, fruitDrop = null, day = 1) {
  const log = document.getElementById('event-log');
  if (!log) return;

  // Remove the empty-state placeholder if present
  const empty = log.querySelector('.event-log__empty');
  if (empty) empty.remove();

  // ── Regular events (prepended in reverse so first event reads on top) ───
  const reversed = [...events].reverse();
  for (const evt of reversed) {
    const entry = _buildEventEntry(evt, day, fruitDrop);
    log.prepend(entry);
  }
}

/**
 * Clears all entries from the event log and restores the empty placeholder.
 */
export function clearLog() {
  const log = document.getElementById('event-log');
  if (!log) return;
  log.innerHTML = `
    <div class="event-log__empty">
      <p>The sea is calm. Hit <strong>Set Sail</strong> from the Hub to begin.</p>
    </div>
  `;
}

/**
 * Displays a self-dismissing toast notification.
 * @param {string} message
 * @param {'success'|'danger'|'gold'|'info'} [type='info']
 * @param {number} [duration=3500] – ms before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback removal in case animationend doesn't fire
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

// ── Private helpers ───────────────────────────────────────────────────────

/**
 * Builds a single .event-entry DOM element with interactive choices.
 * @param {Object} evt
 * @param {number} day
 * @param {Object|null} fruitDrop
 * @returns {HTMLElement}
 */
function _buildEventEntry(evt, day, fruitDrop) {
  const type = evt.type ?? 'story';

  const entry = document.createElement('div');
  entry.className = `event-entry event-entry--${type}`;

  const header = document.createElement('div');
  header.className = 'event-entry__header';

  const title = document.createElement('span');
  title.className   = 'event-entry__title';
  title.textContent = evt.title ?? 'Unknown Event';

  const dayLabel = document.createElement('span');
  dayLabel.className   = 'event-entry__day';
  dayLabel.textContent = `Day ${day}`;

  header.appendChild(title);
  header.appendChild(dayLabel);

  const desc = document.createElement('p');
  desc.className   = 'event-entry__desc';
  desc.textContent = evt.description ?? '';

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'event-entry__actions';
  actionsContainer.style.marginTop = '10px';
  actionsContainer.style.display = 'flex';
  actionsContainer.style.gap = '8px';
  actionsContainer.style.flexWrap = 'wrap';

  // Fallback for legacy events without the JSON choices column
  const choices = Array.isArray(evt.choices) && evt.choices.length > 0
      ? evt.choices
      : [{
        label: 'Continue',
        success: {
          hp: evt.outcome_hp || 0,
          gold: evt.outcome_gold || 0,
          food: evt.outcome_food || 0,
          cola: evt.outcome_cola || 0,
          text: 'The event resolves.',
          item: evt.is_devil_fruit_drop ? 'devil_fruit' : undefined
        }
      }];

  // Generate a button for every choice
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--ghost btn--sm';

    let winChance = 100;

    // Calculate win percentage based on stats OR a fixed chance (for fake-outs)
    if (choice.stat && choice.difficulty) {
      const playerStat = getState()[choice.stat] || 5;
      winChance = Math.min(100, Math.max(5, Math.round((playerStat / choice.difficulty) * 100)));
      btn.textContent = `${choice.label} (${winChance}%)`;
    } else if (choice.chance !== undefined) {
      winChance = choice.chance;
      btn.textContent = `${choice.label} (${winChance}%)`;
    } else {
      btn.textContent = choice.label;
    }

    // Handle the player's decision
    btn.addEventListener('click', async () => {
      actionsContainer.innerHTML = ''; // Lock choice

      const roll = Math.random() * 100;
      const isSuccess = roll <= winChance;
      const outcome = isSuccess ? choice.success : choice.fail;

      applyEventOutcome({ hp: outcome.hp || 0, gold: outcome.gold || 0 });
      if (outcome.food) modifyFood(outcome.food);
      if (outcome.cola) modifyCola(outcome.cola);
      
      if (evt.is_exploration) {
         chargeLogPose(1);
      }

      const currentState = getState();

      const resultText = document.createElement('p');
      resultText.className = 'event-entry__desc';
      resultText.style.fontWeight = 'bold';

      const outcomesDiv = document.createElement('div');
      outcomesDiv.className = 'event-entry__outcomes';

      let finalOutcomeText = outcome.text || (isSuccess ? 'Success!' : 'Failed.');

      // Inject Devil Fruit to inventory if won
      if (outcome.item === 'devil_fruit' || (isSuccess && evt.is_devil_fruit_drop)) {
        if (fruitDrop) {
          addInventoryItem({
            id: fruitDrop.id,
            type: 'devil_fruit',
            name: fruitDrop.name,
            description: fruitDrop.ability,
            statMod: fruitDrop.statMod,
            cssClass: fruitDrop.cssClass,
            glowColor: fruitDrop.glowColor,
            icon: fruitDrop.icon || '🍎'
          });
          outcomesDiv.appendChild(_chip(`Obtained ${fruitDrop.name}!`, 'positive'));
        } else {
          // Fake out fallback
          finalOutcomeText = "You check your bag... it was just a regular, terrible-tasting melon.";
          outcomesDiv.appendChild(_chip(`Just a normal fruit`, 'neutral'));
        }
      } else if (outcome.gold || outcome.hp || outcome.food || outcome.cola || evt.is_exploration) {
        if (evt.is_exploration) outcomesDiv.appendChild(_chip('+1 🧭 Charge', 'positive'));
        if (outcome.gold) outcomesDiv.appendChild(_chip(outcome.gold > 0 ? `+${outcome.gold} 💰` : `${outcome.gold} 💰`, outcome.gold > 0 ? 'positive' : 'negative'));
        if (outcome.hp)   outcomesDiv.appendChild(_chip(outcome.hp > 0 ? `+${outcome.hp} ❤️` : `${outcome.hp} ❤️`, outcome.hp > 0 ? 'positive' : 'negative'));
        if (outcome.food) outcomesDiv.appendChild(_chip(outcome.food > 0 ? `+${outcome.food} 🥩` : `${outcome.food} 🥩`, outcome.food > 0 ? 'positive' : 'negative'));
        if (outcome.cola) outcomesDiv.appendChild(_chip(outcome.cola > 0 ? `+${outcome.cola} 🥤` : `${outcome.cola} 🥤`, outcome.cola > 0 ? 'positive' : 'negative'));
      } else {
        outcomesDiv.appendChild(_chip('No casualties', 'neutral'));
      }

      resultText.textContent = finalOutcomeText;
      actionsContainer.appendChild(resultText);
      actionsContainer.appendChild(outcomesDiv);

      // Dynamically import renderProfile to break the circular dependency cycle!
      const { renderProfile } = await import('./renderCharacter.js');
      renderProfile(currentState);
      
      const { renderHub } = await import('./renderHub.js');
      renderHub(currentState);

      await savePlayer(toSaveObject());

      if (isDead()) {
        showToast('💀 You have fallen. Your legend ends here.', 'danger');
        const sailBtn = document.getElementById('set-sail-btn');
        if (sailBtn) {
          sailBtn.disabled = true;
          sailBtn.textContent = '💀 Voyage Ended';
        }
      }
    });

    actionsContainer.appendChild(btn);
  });

  entry.appendChild(header);
  entry.appendChild(desc);
  entry.appendChild(actionsContainer);

  return entry;
}

/**
 * Creates an outcome chip span.
 * @param {string} text
 * @param {'positive'|'negative'|'neutral'} type
 * @returns {HTMLElement}
 */
function _chip(text, type) {
  const chip = document.createElement('span');
  chip.className   = `outcome-chip outcome-chip--${type}`;
  chip.textContent = text;
  return chip;
}