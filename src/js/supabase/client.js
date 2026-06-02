// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — supabase/client.js
//  Initializes the Supabase client and exposes thin DB helper functions.
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

let _dbReady = null;

export async function checkDbReady() {
  if (!supabase) return false;
  if (_dbReady !== null) return _dbReady;

  const { error } = await supabase
      .from('players')
      .select('id')
      .limit(1);

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

export async function savePlayer(playerData) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  const { data, error } = await supabase
      .from('players')
      .upsert(playerData, { onConflict: 'id' })
      .select()
      .single();
  if (error) console.error('[GLD] savePlayer error:', error.message);
  return { data, error };
}

export async function loadPlayer(id) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };
  const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
  if (error && error.code !== 'PGRST116') {
    console.error('[GLD] loadPlayer error:', error.message);
  }
  return { data, error };
}

export async function authenticatePlayer(name, passcode) {
  if (!supabase || !(await checkDbReady())) return { data: null, error: null };

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

export async function fetchAvailableCrew(playerId) {
  if (!supabase || !(await checkDbReady())) return { data: [], error: null };

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

export async function loadPlayerCrew(playerId) {
  if (!supabase || !(await checkDbReady())) return { data: [], error: null };
  const { data, error } = await supabase
      .from('player_crew')
      .select('joined_day, current_hp, crew_roster(*)')
      .eq('player_id', playerId)
      .order('joined_day', { ascending: true });

  if (error) {
    console.error('[GLD] loadPlayerCrew error:', error.message);
    return { data: [], error };
  }

  // Flatten: merge crew_roster fields + joined_day into one object
  const flat = (data ?? []).map(row => ({
    ...row.crew_roster,
    joined_day: row.joined_day,
    // If current_hp is null (just recruited), use the base hp from the roster
    hp: row.current_hp !== null ? row.current_hp : row.crew_roster.hp
  }));
  return { data: flat, error: null };
}

export async function saveCrewHp(playerId, crewId, currentHp) {
  if (!supabase || !(await checkDbReady())) return { error: null };
  const { error } = await supabase
      .from('player_crew')
      .update({ current_hp: currentHp })
      .match({ player_id: playerId, crew_id: crewId });

  if (error) console.error('[GLD] saveCrewHp error:', error.message);
  return { error };
}