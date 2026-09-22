import { TournamentDatabaseData } from '../types';
import { INITIAL_TEAMS, INITIAL_GROUPS, INITIAL_MATCHES } from '../data/initialData';
import { INITIAL_R16_MATCHES, INITIAL_QF_MATCHES, INITIAL_SF_MATCHES, INITIAL_FINAL_MATCH } from '../data/bracketData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('scicup_database_v1');
    localStorage.removeItem('scicup_database_v2');
  }
} catch (e) {}

const LOCAL_STORAGE_KEY = 'scicup_database_v3';
const SUPABASE_ROW_ID = 'sci_cup_main';

export const DEFAULT_DATABASE_DATA: TournamentDatabaseData = {
  tournamentName: 'SCI CUP 2026',
  teams: [],
  groups: {},
  matches: [],
  knockoutStartingRound: 'sf',
  r16Matches: INITIAL_R16_MATCHES,
  qfMatches: INITIAL_QF_MATCHES,
  sfMatches: INITIAL_SF_MATCHES,
  finalMatch: INITIAL_FINAL_MATCH,
  isBracketLocked: false,
  isKnockoutCreated: false,
  isUserPortalEnabled: true,
};

/**
 * Helper to normalize database data across Local API, Supabase, and LocalStorage
 */
export function formatDatabaseData(data: any): TournamentDatabaseData {
  if (!data || typeof data !== 'object') {
    return DEFAULT_DATABASE_DATA;
  }

  const adminCreds =
    data.admin_credentials && typeof data.admin_credentials === 'object'
      ? data.admin_credentials
      : data.adminCredentials && typeof data.adminCredentials === 'object'
        ? data.adminCredentials
        : {};

  return {
    tournamentName: data.tournament_name || data.tournamentName || DEFAULT_DATABASE_DATA.tournamentName,
    teams: Array.isArray(data.teams) ? data.teams : [],
    groups: data.groups && typeof data.groups === 'object' ? data.groups : {},
    matches: Array.isArray(data.matches) ? data.matches : [],
    knockoutStartingRound:
      data.knockout_starting_round ||
      data.knockoutStartingRound ||
      adminCreds.knockoutStartingRound ||
      DEFAULT_DATABASE_DATA.knockoutStartingRound,
    r16Matches: Array.isArray(data.r16_matches || data.r16Matches || adminCreds.r16Matches)
      ? data.r16_matches || data.r16Matches || adminCreds.r16Matches
      : DEFAULT_DATABASE_DATA.r16Matches,
    qfMatches: Array.isArray(data.qf_matches || data.qfMatches)
      ? data.qf_matches || data.qfMatches
      : DEFAULT_DATABASE_DATA.qfMatches,
    sfMatches: Array.isArray(data.sf_matches || data.sfMatches)
      ? data.sf_matches || data.sfMatches
      : DEFAULT_DATABASE_DATA.sfMatches,
    finalMatch: data.final_match || data.finalMatch || DEFAULT_DATABASE_DATA.finalMatch,
    isBracketLocked:
      typeof data.is_bracket_locked === 'boolean'
        ? data.is_bracket_locked
        : typeof data.isBracketLocked === 'boolean'
          ? data.isBracketLocked
          : typeof adminCreds.isBracketLocked === 'boolean'
            ? adminCreds.isBracketLocked
            : false,
    isKnockoutCreated:
      typeof data.is_knockout_created === 'boolean'
        ? data.is_knockout_created
        : typeof data.isKnockoutCreated === 'boolean'
          ? data.isKnockoutCreated
          : typeof adminCreds.isKnockoutCreated === 'boolean'
            ? adminCreds.isKnockoutCreated
            : false,
    isUserPortalEnabled:
      typeof data.is_user_portal_enabled === 'boolean'
        ? data.is_user_portal_enabled
        : typeof data.isUserPortalEnabled === 'boolean'
          ? data.isUserPortalEnabled
          : typeof adminCreds.isUserPortalEnabled === 'boolean'
            ? adminCreds.isUserPortalEnabled
            : true,
    adminCredentials: {
      username: adminCreds.username || 'admin',
      passwordHash: adminCreds.passwordHash || '1234',
    },
    updatedAt: data.updated_at
      ? typeof data.updated_at === 'number'
        ? data.updated_at
        : new Date(data.updated_at).getTime()
      : data.updatedAt || 0,
  };
}

/**
 * Load tournament data from Local API Backend -> Supabase Cloud -> LocalStorage Cache -> Defaults
 */
export async function fetchDatabase(): Promise<TournamentDatabaseData> {
  // 1. Try Local Express / Vite API Backend first (fastest, accurate for local dev)
  try {
    const res = await fetch(`/api/db?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const rawData = await res.json();
      const formatted = formatDatabaseData(rawData);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
      } catch (e) {}
      return formatted;
    }
  } catch (err) {
    console.warn('Local API fetch failed, checking alternatives:', err);
  }

  // 2. Try Supabase Cloud Database if configured (with 3s timeout)
  if (isSupabaseConfigured && supabase) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase fetch timeout')), 3000)
      );
      const fetchPromise = supabase
        .from('tournament_data')
        .select('*')
        .eq('id', SUPABASE_ROW_ID)
        .single();

      const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (!error && data) {
        const formatted = formatDatabaseData(data);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
        } catch (e) {}
        return formatted;
      }
    } catch (err) {
      console.warn('Supabase fetch skipped or timed out:', err);
    }
  }

  // 3. Try LocalStorage Fallback
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      return formatDatabaseData(JSON.parse(cached));
    }
  } catch (e) {
    console.error('Failed to parse cached database:', e);
  }

  return DEFAULT_DATABASE_DATA;
}

/**
 * Save tournament data to Local API & LocalStorage immediately, and sync to Supabase in background or awaited
 */
export async function saveDatabase(data: TournamentDatabaseData): Promise<boolean> {
  // 1. Update LocalStorage cache immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to LocalStorage:', e);
  }

  // 2. Save to Local Express / Vite API Backend immediately
  let savedLocal = false;
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    savedLocal = res.ok;
  } catch (err) {
    console.warn('Failed to save to Local API:', err);
  }

  // 3. Save to Supabase Cloud Database
  let savedSupabase = false;
  if (isSupabaseConfigured && supabase) {
    const adminCreds = {
      ...(data.adminCredentials || { username: 'admin', passwordHash: '1234' }),
      knockoutStartingRound: data.knockoutStartingRound || 'sf',
      r16Matches: data.r16Matches,
      isBracketLocked: data.isBracketLocked,
      isKnockoutCreated: data.isKnockoutCreated,
      isUserPortalEnabled: data.isUserPortalEnabled,
    };

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase save timeout')), 4000)
      );
      const upsertPromise = supabase.from('tournament_data').upsert({
        id: SUPABASE_ROW_ID,
        tournament_name: data.tournamentName,
        teams: data.teams,
        groups: data.groups,
        matches: data.matches,
        qf_matches: data.qfMatches,
        sf_matches: data.sfMatches,
        final_match: data.finalMatch,
        admin_credentials: adminCreds,
        updated_at: new Date().toISOString(),
      });
      const res: any = await Promise.race([upsertPromise, timeoutPromise]);
      savedSupabase = !res?.error;
    } catch (err) {
      console.warn('Supabase save error:', err);
    }
  }

  return savedLocal || savedSupabase;
}

/**
 * Reset database to initial default values across Supabase and Local
 */
export async function resetDatabase(): Promise<TournamentDatabaseData> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE_DATA));
  } catch (e) {
    console.error('Failed to reset LocalStorage:', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('tournament_data').delete().eq('id', SUPABASE_ROW_ID);
    } catch (err) {
      console.warn('Failed to reset Supabase:', err);
    }
  }

  try {
    await fetch('/api/db/reset', { method: 'POST' });
  } catch (err) {
    console.warn('Failed to reset local API:', err);
  }

  return DEFAULT_DATABASE_DATA;
}

export function loadDatabaseSync(): TournamentDatabaseData {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  return DEFAULT_DATABASE_DATA;
}
