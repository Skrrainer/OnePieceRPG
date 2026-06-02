// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderAuth.js
//  Handles login, registration, passcode hashing, and auth UI events.
// ═══════════════════════════════════════════════════════════════════════════

import { SEAS, CLASSES, STARTING_GOLD, DEVIL_FRUITS } from '../config/gameData.js';
import { pickSpawnIsland, getSeaForIsland } from '../../config/islands.js';
import { setCrew } from '../engine/crewState.js';
import { assignSea } from '../engine/rng.js';
import { initState, getState, toSaveObject } from '../engine/playerState.js';
import { savePlayer, authenticatePlayer } from '../supabase/client.js';
import { switchScreen } from '../main.js';
import { showToast } from './renderEvents.js';
import { renderHub } from './renderHub.js';
import { initInlineMap } from './renderMap.js';
import { renderProfile, renderCrew, updateHubDay } from './renderCharacter.js';

// ── Cryptography Helper ───────────────────────────────────────────────────

/**
 * Creates a secure SHA-256 hash of the user's passcode.
 * @param {string} passcode
 * @returns {Promise<string>} Hexadecimal hash string
 */
async function hashPasscode(passcode) {
    const msgBuffer = new TextEncoder().encode(passcode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Authentication & Creation Form ─────────────────────────────────────────

export function initAuthForms() {
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

        // Looks for the new 'role' radio buttons, but falls back to 'combatStyle' just in case the HTML isn't updated yet.
        const roleInput = registerForm.querySelector('input[name="role"]:checked') || registerForm.querySelector('input[name="combatStyle"]:checked');

        const name = nameInput?.value.trim();
        const rawPasscode = passInput?.value.trim();

        if (!name || name.length < 1) return _showError(errorBox, 'A pirate without a name is just a ghost. Enter yours.');
        if (!rawPasscode || rawPasscode.length < 3) return _showError(errorBox, 'Enter a secure passcode (at least 3 characters).');
        if (!roleInput) return _showError(errorBox, 'Choose your Ship Role before embarking.');

        const roleKey = roleInput.value;
        const roleDef = CLASSES[roleKey];
        if (!roleDef) return _showError(errorBox, 'Unknown ship role.');

        // Pick a spawn island first, then derive the sea from its location
        const spawnIsland = pickSpawnIsland();
        const spawnSeaId  = getSeaForIsland(spawnIsland);
        const sea         = (spawnSeaId ? SEAS.find(s => s.id === spawnSeaId) : null) ?? assignSea(SEAS);

        // Securely hash the passcode before it enters state
        const hashedPasscode = await hashPasscode(rawPasscode);

        // Player state now handles auto-calculating D&D attributes and HP based on the role
        initState({
            name,
            role:           roleKey,
            seaOfOrigin:    sea,
            day:            1,
            gold:           STARTING_GOLD,
            passcode:       hashedPasscode,
            currentIsland:  spawnIsland.id,
        });

        const freshState = getState();
        registerBtn.disabled = true;
        registerBtn.textContent = '⚓ Setting sail...';

        // Get cleanly mapped object for Supabase
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
        const rawPasscode = passInput?.value.trim();

        if (!name || !rawPasscode) return _showError(errorBox, 'Please enter both name and passcode.');

        loginBtn.disabled = true;
        loginBtn.textContent = 'Searching records...';

        // Hash the input before comparing it against the database
        const hashedPasscode = await hashPasscode(rawPasscode);
        const { data, error } = await authenticatePlayer(name, hashedPasscode);

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
            role:         data.role,
            maxHp:        data.max_hp,
            shipHp:       data.ship_hp,
            shipHpMax:    data.ship_hp_max,
            hasFruit:     data.has_fruit,
            devilFruit:   fruitObj,
            passcode:     hashedPasscode,
            bounty:       data.bounty ?? 0,
            logPoseCharge: data.log_pose_charge ?? 0,
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
    updateHubDay(state.day);
    initInlineMap();
}

// ── Form Helpers ─────────────────────────────────────────────────────────

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