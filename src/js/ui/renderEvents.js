// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderEvents.js
//  Voyage event log rendering, d20 stat checks, and outcomes.
// ═══════════════════════════════════════════════════════════════════════════

import {
  getState,
  getModifier,
  applyEventOutcome,
  toSaveObject,
  isDead,
  addInventoryItem,
  modifyFood,
  modifyCola,
  chargeLogPose,
  gainExp
} from '../engine/playerState.js';
import { savePlayer } from '../supabase/client.js';
import { rollStatCheck } from '../engine/rng.js';

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

    let isDiceRoll = false;

    // Detect if this choice requires a d20 stat check
    // Assuming the database now passes { stat: 'dex', dc: 15 } instead of { stat: 'accuracy', difficulty: 10 }
    const targetStat = choice.stat ? choice.stat.toLowerCase() : null;
    const targetDc = choice.dc || choice.difficulty; // Support legacy 'difficulty' tag temporarily

    if (targetStat && targetDc) {
      isDiceRoll = true;
      const mod = getModifier(targetStat);
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
      btn.textContent = `${choice.label} [${targetStat.toUpperCase()} ${modStr} vs DC ${targetDc}]`;
    } else if (choice.chance !== undefined) {
      btn.textContent = `${choice.label} (${choice.chance}%)`;
    } else {
      btn.textContent = choice.label;
    }

    // Handle the player's decision
    btn.addEventListener('click', async () => {
      actionsContainer.innerHTML = ''; // Lock choice

      let isSuccess = true;
      let rollOutput = null;

      // Resolve the D&D dice roll
      if (isDiceRoll) {
        const mod = getModifier(targetStat);
        // Passing 0 for proficiency temporarily until we map out specific skill proficiencies
        const rollResult = rollStatCheck(mod, 0, targetDc);
        isSuccess = rollResult.success;

        rollOutput = document.createElement('p');
        rollOutput.className = 'event-entry__desc roll-output';
        rollOutput.style.fontStyle = 'italic';
        rollOutput.style.margin = '8px 0';

        if (rollResult.isCritical && rollResult.roll === 20) {
          rollOutput.textContent = `🎲 Natural 20! Critical Success! (Total: ${rollResult.total} vs DC ${targetDc})`;
          rollOutput.style.color = '#d4af37'; // Gold
        } else if (rollResult.isCritical && rollResult.roll === 1) {
          rollOutput.textContent = `🎲 Natural 1! Critical Failure! (Total: ${rollResult.total} vs DC ${targetDc})`;
          rollOutput.style.color = '#ff6b6b'; // Danger red
        } else {
          const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
          rollOutput.textContent = `🎲 Rolled a ${rollResult.roll} ${modStr} = ${rollResult.total} vs DC ${targetDc}.`;
          rollOutput.style.color = isSuccess ? '#4caf72' : '#ff6b6b';
        }
      } else if (choice.chance !== undefined) {
        isSuccess = (Math.random() * 100) <= choice.chance;
      }

      const outcome = isSuccess ? choice.success : choice.fail;

      // Apply modifiers
      applyEventOutcome({ hp: outcome.hp || 0, gold: outcome.gold || 0 });
      if (outcome.food) modifyFood(outcome.food);
      if (outcome.cola) modifyCola(outcome.cola);

      if (evt.is_exploration) {
        chargeLogPose(1);
      }

      // Grant EXP for successful rolls
      let expGained = 0;
      if (isSuccess && targetDc) {
        expGained = targetDc * 5; // e.g. DC 15 gives 75 EXP
        gainExp(expGained);
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
            attributeBuffs: fruitDrop.attributeBuffs,
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
      } else {
        if (expGained > 0) outcomesDiv.appendChild(_chip(`+${expGained} EXP`, 'positive'));
        if (evt.is_exploration) outcomesDiv.appendChild(_chip('+1 🧭 Charge', 'positive'));
        if (outcome.gold) outcomesDiv.appendChild(_chip(outcome.gold > 0 ? `+${outcome.gold} 💰` : `${outcome.gold} 💰`, outcome.gold > 0 ? 'positive' : 'negative'));
        if (outcome.hp)   outcomesDiv.appendChild(_chip(outcome.hp > 0 ? `+${outcome.hp} ❤️` : `${outcome.hp} ❤️`, outcome.hp > 0 ? 'positive' : 'negative'));
        if (outcome.food) outcomesDiv.appendChild(_chip(outcome.food > 0 ? `+${outcome.food} 🥩` : `${outcome.food} 🥩`, outcome.food > 0 ? 'positive' : 'negative'));
        if (outcome.cola) outcomesDiv.appendChild(_chip(outcome.cola > 0 ? `+${outcome.cola} 🥤` : `${outcome.cola} 🥤`, outcome.cola > 0 ? 'positive' : 'negative'));

        // If literally nothing changed and no EXP was gained, show a neutral chip
        if (!outcome.gold && !outcome.hp && !outcome.food && !outcome.cola && !evt.is_exploration && expGained === 0) {
          outcomesDiv.appendChild(_chip('No casualties', 'neutral'));
        }
      }

      resultText.textContent = finalOutcomeText;

      // Append elements in reading order
      if (rollOutput) actionsContainer.appendChild(rollOutput);
      actionsContainer.appendChild(resultText);
      actionsContainer.appendChild(outcomesDiv);

      // Dynamically import renderProfile to break the circular dependency cycle
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