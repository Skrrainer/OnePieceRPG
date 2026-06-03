// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderEvents.js
//  Map modals, stat checks, and outcome applications.
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
import { startNavalCombat } from '../engine/navalCombat.js';
import { updateNavalUI } from './renderNaval.js';
import { getCrew } from '../engine/crewState.js';

export function promptMapEvent(evt, fruitDrop, day) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'map-event-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:9000; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter: blur(4px);';

    const card = document.createElement('div');
    card.style.cssText = 'background:var(--color-bg-deep); border:2px solid var(--color-gold); border-radius:8px; padding:1.5rem; max-width:550px; width:100%; box-shadow:0 10px 40px rgba(0,0,0,0.9);';

    const mapHeader = document.createElement('h3');
    mapHeader.style.cssText = 'color: var(--color-gold); font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; margin-bottom: 1rem; border-bottom: 1px dashed var(--color-border); padding-bottom: 0.5rem;';
    mapHeader.textContent = '⚓ Event at Sea';
    card.appendChild(mapHeader);

    const entry = _buildEventEntry(evt, day, fruitDrop, (outcome) => {
      overlay.remove();
      resolve(outcome);
    });

    card.appendChild(entry);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}

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
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

function _buildEventEntry(evt, day, fruitDrop, onComplete = null) {
  const type = evt.type ?? 'story';

  const entry = document.createElement('div');
  entry.className = `event-entry event-entry--${type}`;
  if (onComplete) {
    entry.style.background = 'transparent';
    entry.style.border = 'none';
    entry.style.padding = '0';
  }

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
  actionsContainer.style.marginTop = '15px';
  actionsContainer.style.display = 'flex';
  actionsContainer.style.gap = '8px';
  actionsContainer.style.flexWrap = 'wrap';

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

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--ghost btn--sm';

    let isDiceRoll = false;
    const targetStat = choice.stat ? choice.stat.toLowerCase() : null;
    const targetDc = choice.dc || choice.difficulty;

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

    btn.addEventListener('click', async () => {
      actionsContainer.innerHTML = '';

      let isSuccess = true;
      let rollOutput = null;

      if (isDiceRoll) {
        const mod = getModifier(targetStat);
        const rollResult = rollStatCheck(mod, 0, targetDc);
        isSuccess = rollResult.success;

        rollOutput = document.createElement('p');
        rollOutput.className = 'event-entry__desc roll-output';
        rollOutput.style.fontStyle = 'italic';
        rollOutput.style.margin = '8px 0';

        if (rollResult.isCritical && rollResult.roll === 20) {
          rollOutput.textContent = `🎲 Natural 20! Critical Success! (Total: ${rollResult.total} vs DC ${targetDc})`;
          rollOutput.style.color = '#d4af37';
        } else if (rollResult.isCritical && rollResult.roll === 1) {
          rollOutput.textContent = `🎲 Natural 1! Critical Failure! (Total: ${rollResult.total} vs DC ${targetDc})`;
          rollOutput.style.color = '#ff6b6b';
        } else {
          const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
          rollOutput.textContent = `🎲 Rolled a ${rollResult.roll} ${modStr} = ${rollResult.total} vs DC ${targetDc}.`;
          rollOutput.style.color = isSuccess ? '#4caf72' : '#ff6b6b';
        }
      } else if (choice.chance !== undefined) {
        isSuccess = (Math.random() * 100) <= choice.chance;
      }

      const outcome = isSuccess ? choice.success : choice.fail;

      let playerWonCombat = null;
      if (outcome.triggerNavalCombat) {
        document.getElementById('naval-overlay').hidden = false;
        const fleetEnergy = 3 + getCrew().length;

        playerWonCombat = await new Promise(resolve => {
          startNavalCombat(fleetEnergy, updateNavalUI, (won) => {
            document.getElementById('naval-overlay').hidden = true;
            resolve(won);
          });
        });

        if (playerWonCombat) {
          applyEventOutcome({ gold: 100 });
          gainExp(50);
          showToast('Enemy ship sunk! Claimed 100g and 50 EXP.', 'success');
        } else {
          applyEventOutcome({ hp: -25 });
          showToast('Your ship was heavily damaged in combat!', 'danger');
        }
      }

      applyEventOutcome({ hp: outcome.hp || 0, gold: outcome.gold || 0 });
      if (outcome.food) modifyFood(outcome.food);
      if (outcome.cola) modifyCola(outcome.cola);

      if (evt.is_exploration) chargeLogPose(1);

      let expGained = 0;
      if (isSuccess && targetDc) {
        expGained = targetDc * 5;
        gainExp(expGained);
      }

      const currentState = getState();
      const resultText = document.createElement('p');
      resultText.className = 'event-entry__desc';
      resultText.style.fontWeight = 'bold';

      const outcomesDiv = document.createElement('div');
      outcomesDiv.className = 'event-entry__outcomes';

      let finalOutcomeText = outcome.text || (isSuccess ? 'Success!' : 'Failed.');

      if (outcome.triggerNavalCombat) {
        finalOutcomeText += playerWonCombat ? " The enemy vessel was destroyed." : " You barely escaped with your lives.";
      }

      if (outcome.item === 'devil_fruit' || (isSuccess && evt.is_devil_fruit_drop)) {
        if (fruitDrop) {
          addInventoryItem({
            id: fruitDrop.id, type: 'devil_fruit', name: fruitDrop.name, description: fruitDrop.ability,
            attributeBuffs: fruitDrop.attributeBuffs, cssClass: fruitDrop.cssClass, glowColor: fruitDrop.glowColor, icon: fruitDrop.icon || '🍎'
          });
          outcomesDiv.appendChild(_chip(`Obtained ${fruitDrop.name}!`, 'positive'));
        } else {
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

        if (outcome.triggerNavalCombat) {
          if (playerWonCombat) {
            outcomesDiv.appendChild(_chip('+100 💰', 'positive'));
            outcomesDiv.appendChild(_chip('+50 EXP', 'positive'));
          } else {
            outcomesDiv.appendChild(_chip('-25 ❤️', 'negative'));
          }
        }

        if (!outcome.gold && !outcome.hp && !outcome.food && !outcome.cola && !evt.is_exploration && expGained === 0 && !outcome.triggerNavalCombat) {
          outcomesDiv.appendChild(_chip('No casualties', 'neutral'));
        }
      }

      resultText.textContent = finalOutcomeText;

      if (rollOutput) actionsContainer.appendChild(rollOutput);
      actionsContainer.appendChild(resultText);
      actionsContainer.appendChild(outcomesDiv);

      const { renderProfile } = await import('./renderCharacter.js');
      renderProfile(currentState);

      const { renderHub } = await import('./renderHub.js');
      renderHub(currentState);

      await savePlayer(toSaveObject());

      if (isDead()) {
        showToast('💀 You have fallen. Your legend ends here.', 'danger');
        if (onComplete) onComplete(null);
      } else if (onComplete) {
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn--primary btn--full';
        continueBtn.style.marginTop = '15px';
        continueBtn.textContent = evt.is_exploration ? 'Return to Hub' : 'Continue Voyage 🌊';
        continueBtn.onclick = () => onComplete(outcome);
        actionsContainer.appendChild(continueBtn);
      }
    });

    actionsContainer.appendChild(btn);
  });

  entry.appendChild(header);
  entry.appendChild(desc);
  entry.appendChild(actionsContainer);

  return entry;
}

function _chip(text, type) {
  const chip = document.createElement('span');
  chip.className   = `outcome-chip outcome-chip--${type}`;
  chip.textContent = text;
  return chip;
}