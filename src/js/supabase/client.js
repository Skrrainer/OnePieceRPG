// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — supabase/client.js
//  Initializes the Supabase client and exposes thin DB helper functions.
//
//  REQUIRED: Create a .env file in the project root with:
//    VITE_SUPABASE_URL=https://your-project.supabase.co
//    VITE_SUPABASE_ANON_KEY=your-anon-key
//
//  SUPABASE SCHEMA:
//    Table: players
//      id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
//      name          text  NOT NULL UNIQUE
//      passcode      text  NOT NULL
//      combat_style  text  NOT NULL
//      sea_of_origin text  NOT NULL
//      day           int   DEFAULT 1
//      hp            int   DEFAULT 100
//      max_hp        int   DEFAULT 100
//      gold          int   DEFAULT 250
//      ship_hp       int   DEFAULT 100
//      ship_hp_max   int   DEFAULT 100
//      attack        int   DEFAULT 5
//      defense       int   DEFAULT 5
//      accuracy      int   DEFAULT 5
//      devil_fruit   text  DEFAULT NULL
//      has_fruit     bool  DEFAULT false
//      inventory     jsonb DEFAULT '[]'
//      created_at    timestamptz DEFAULT now()
//
//    Table: events
//      id                 uuid  PRIMARY KEY DEFAULT gen_random_uuid()
//      sea_id             text  NOT NULL
//      difficulty         int   NOT NULL
//      type               text  NOT NULL  -- 'combat' | 'loot' | 'story' | 'weather'
//      title              text  NOT NULL
//      description        text  NOT NULL
//      outcome_gold       int   DEFAULT 0
//      outcome_hp         int   DEFAULT 0
//      is_devil_fruit_drop bool DEFAULT false
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[GLD] Supabase env vars not found. Falling back to local mode.');
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ── DB readiness flag ─────────────────────────────────────────────────────
// Set to false if we detect the tables don't exist yet.
let _dbReady = null; // null = unchecked, true = ready, false = not ready

/**
 * Returns true if the 'players' table exists and is reachable.
 * Result is cached for the session — only checks once.
 */
export async function checkDbReady() {
  if (!supabase) return false;
  if (_dbReady !== null) return _dbReady;

  const { error } = await supabase
    .from('players')
    .select('id')
    .limit(1);

  // PGRST200 = schema cache miss (table doesn't exist)
  // 42P01    = undefined table (postgres)
  if (error && (
    error.code === 'PGRST200' ||
    error.code === '42P01' ||
    error.message?.toLowerCase().includes('schema cache') ||
    error.message?.toLowerCase().includes('does not exist')
  )) {
    console.warn(
      '[GLD] Database tables not found.\n' +
      '👉 Run supabase/schema.sql in your Supabase SQL Editor:\n' +
      '   https://supabase.com/dashboard → SQL Editor → New Query → paste → Run'
    );
    _dbReady = false;
  } else {
    _dbReady = true;
  }

  return _dbReady;
}

/**
 * Upsert a player record.
 */
export async function savePlayer(playerData) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  const { data, error } = await supabase
    .from('players')
    .upsert(playerData, { onConflict: 'id' }) // Changed back to ID since that is usually the actual primary key and is reliable if we pass an ID down. We will rely on Postgres error 23505 (unique violation) for name uniqueness handling
    .select()
    .single();
  if (error) console.error('[GLD] savePlayer error:', error.message);
  return { data, error };
}

/**
 * Load a player by UUID.
 */
export async function loadPlayer(id) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  // PGRST116 = no rows found (valid — player just doesn't exist yet)
  if (error && error.code !== 'PGRST116') {
    console.error('[GLD] loadPlayer error:', error.message);
  }
  return { data, error };
}

/**
 * Load a player by Name and Passcode
 */
export async function authenticatePlayer(name, passcode) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  
  // Note: Storing plain text passcodes is not secure in a real production app.
  // For a small browser game it works, but a proper solution would hash the password
  // or use Supabase Auth.
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .ilike('name', name)
    .eq('passcode', passcode)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('[GLD] authenticatePlayer error:', error.message);
  }
  return { data, error };
}

/**
 * Fetch random events matching sea and difficulty.
 */
export async function fetchEvents(seaId, difficulty, count = 2) {
  if (!supabase || !(await checkDbReady())) return { data: [], error: null };

  const pool = count * 4;
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .or(`sea_id.eq.${seaId},sea_id.eq.all`)
    .lte('difficulty', difficulty)
    .limit(pool);

  if (error) {
    console.error('[GLD] fetchEvents error:', error.message);
    return { data: [], error };
  }

  if (!data || data.length === 0) return { data: [], error: null };

  const shuffled = data.sort(() => Math.random() - 0.5);
  return { data: shuffled.slice(0, count), error: null };
}

/**
 * Mark that a player has consumed a Devil Fruit.
 */
export async function claimDevilFruit(playerId, fruitId) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  const { data, error } = await supabase
    .from('players')
    .update({ devil_fruit: fruitId, has_fruit: true })
    .eq('id', playerId)
    .select()
    .single();
  if (error) console.error('[GLD] claimDevilFruit error:', error.message);
  return { data, error };
}

/**
 * Fetch all crew_roster members NOT yet recruited by this player.
 * Returns the full roster if player has everyone already.
 * @param {string} playerId
 */
export async function fetchAvailableCrew(playerId) {
  if (!supabase || !(await checkDbReady())) return { data: [], error: null };

  // Get IDs already recruited by this player
  const { data: existing } = await supabase
    .from('player_crew')
    .select('crew_id')
    .eq('player_id', playerId);

  const recruitedIds = (existing ?? []).map(r => r.crew_id);

  let query = supabase.from('crew_roster').select('*');
  if (recruitedIds.length > 0) {
    query = query.not('id', 'in', `(${recruitedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) console.error('[GLD] fetchAvailableCrew error:', error.message);
  return { data: data ?? [], error };
}

/**
 * Record that a player recruited a crew_roster member.
 * @param {string} playerId
 * @param {string} crewId   - crew_roster row id
 * @param {number} joinedDay
 */
export async function recruitFromRoster(playerId, crewId, joinedDay) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  const { data, error } = await supabase
    .from('player_crew')
    .insert({ player_id: playerId, crew_id: crewId, joined_day: joinedDay })
    .select()
    .single();
  if (error) console.error('[GLD] recruitFromRoster error:', error.message);
  return { data, error };
}

/**
 * Load all crew for a player, joined with their roster stats.
 * Returns an array of crew_roster rows augmented with joined_day.
 * @param {string} playerId
 */
export async function loadPlayerCrew(playerId) {
  if (!supabase || !(await checkDbReady())) return { data: [], error: null };
  const { data, error } = await supabase
    .from('player_crew')
    .select('joined_day, crew_roster(*)')
    .eq('player_id', playerId)
    .order('joined_day', { ascending: true });

  if (error) {
    console.error('[GLD] loadPlayerCrew error:', error.message);
    return { data: [], error };
  }

  // Flatten: merge crew_roster fields + joined_day into one object
  const flat = (data ?? []).map(row => ({ ...row.crew_roster, joined_day: row.joined_day }));
  return { data: flat, error: null };
}
