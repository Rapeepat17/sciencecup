import {
  TournamentDatabaseData,
  TournamentItem,
  TournamentStatus,
  Team,
  Player,
  Match,
  GroupMap,
  BracketMatchup,
} from '../types';
import {
  INITIAL_R16_MATCHES,
  INITIAL_QF_MATCHES,
  INITIAL_SF_MATCHES,
  INITIAL_FINAL_MATCH,
} from '../data/bracketData';
import { getPersistedLogo, persistAllTeamLogos } from '../utils/logoStorage';
import { tournamentService } from './tournamentService';
import { teamService } from './teamService';
import { matchService } from './matchService';
import { apiClient } from './apiClient';

export const DEFAULT_TOURNAMENT_ID = '1000';
export const LOCAL_STORAGE_KEY = 'scicup_database_v4';
export const TOURNAMENTS_INDEX_KEY = 'scicup_tournaments_index_v1';

export function getLocalStorageKey(tournamentId: string = DEFAULT_TOURNAMENT_ID): string {
  if (!tournamentId || tournamentId === DEFAULT_TOURNAMENT_ID) {
    return LOCAL_STORAGE_KEY;
  }
  return `scicup_database_v4_${tournamentId}`;
}

export const DEFAULT_DATABASE_DATA: TournamentDatabaseData = {
  id: '',
  tournamentName: '',
  status: 'ACTIVE',
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

export function formatDatabaseData(data: any, tournamentId: string = DEFAULT_TOURNAMENT_ID): TournamentDatabaseData {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_DATABASE_DATA, id: tournamentId };
  }

  return {
    id: data.id || tournamentId || DEFAULT_TOURNAMENT_ID,
    tournamentName: data.tournament_name || data.tournamentName || data.name || DEFAULT_DATABASE_DATA.tournamentName,
    status: (data.status as TournamentStatus) || 'ACTIVE',
    startDate: data.start_date || data.startDate || '',
    endDate: data.end_date || data.endDate || '',
    description: data.description || '',
    teams: Array.isArray(data.teams) ? data.teams : [],
    groups: data.groups && typeof data.groups === 'object' ? data.groups : {},
    matches: Array.isArray(data.matches) ? data.matches : [],
    knockoutStartingRound: data.knockout_starting_round || data.knockoutStartingRound || DEFAULT_DATABASE_DATA.knockoutStartingRound,
    r16Matches: Array.isArray(data.r16_matches || data.r16Matches)
      ? data.r16_matches || data.r16Matches
      : DEFAULT_DATABASE_DATA.r16Matches,
    qfMatches: Array.isArray(data.qf_matches || data.qfMatches)
      ? data.qf_matches || data.qfMatches
      : DEFAULT_DATABASE_DATA.qfMatches,
    sfMatches: Array.isArray(data.sf_matches || data.sfMatches)
      ? data.sf_matches || data.sfMatches
      : DEFAULT_DATABASE_DATA.sfMatches,
    finalMatch: data.final_match || data.finalMatch || DEFAULT_DATABASE_DATA.finalMatch,
    isBracketLocked: Boolean(data.is_bracket_locked || data.isBracketLocked),
    isKnockoutCreated: Boolean(data.is_knockout_created || data.isKnockoutCreated),
    isUserPortalEnabled: data.is_user_portal_enabled !== undefined ? Boolean(data.is_user_portal_enabled) : true,
    updatedAt: data.updatedAt || Date.now(),
  };
}

export function loadTournamentsListSync(): TournamentItem[] {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function loadDatabaseSync(tournamentId: string = DEFAULT_TOURNAMENT_ID): TournamentDatabaseData {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(tournamentId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return formatDatabaseData(parsed, tournamentId);
    }
  } catch {}
  return { ...DEFAULT_DATABASE_DATA, id: tournamentId };
}

/**
 * Fetch tournaments list via Backend API v1 with local cache fallback
 */
export async function fetchTournamentsList(): Promise<TournamentItem[]> {
  try {
    const list = await tournamentService.getAll();
    if (Array.isArray(list)) {
      return list.map((t: any) => ({
        id: t.id,
        name: t.name || '',
        logo: t.logo || '',
        startDate: t.startDate || t.start_date || '',
        endDate: t.endDate || t.end_date || '',
        description: t.description || '',
        knockoutStartingRound: t.knockoutStartingRound || t.knockout_starting_round || 'sf',
        isUserPortalEnabled: t.isUserPortalEnabled ?? t.is_user_portal_enabled ?? true,
        isBracketLocked: Boolean(t.isBracketLocked ?? t.is_bracket_locked),
        isKnockoutCreated: Boolean(t.isKnockoutCreated ?? t.is_knockout_created),
        createdAt: t.createdAt || t.created_at || Date.now(),
        updatedAt: t.updatedAt || t.updated_at || Date.now(),
      }));
    }
  } catch (err) {
    console.warn('[dbService] Backend tournaments list fetch failed:', err);
  }
  return [];
}

/**
 * Create a new tournament via Backend API v1
 */
export async function createTournament(meta: {
  id?: string;
  name: string;
  status?: TournamentStatus;
  logo?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}): Promise<TournamentItem> {
  // Call Backend API directly - Only Backend saves to database, no frontend local storage saving
  const res = await tournamentService.create({
    id: meta.id || undefined,
    name: meta.name.trim() || 'รายการแข่งขันใหม่',
    description: meta.description || '',
    logo: meta.logo || undefined,
    start_date: meta.startDate || undefined,
    end_date: meta.endDate || undefined,
    knockout_starting_round: 'sf',
    is_user_portal_enabled: true,
  });

  const createdData = res?.data || res;

  const newItem: TournamentItem = {
    id: createdData.id || meta.id || '',
    name: createdData.name || meta.name.trim(),
    status: createdData.status || meta.status || 'ACTIVE',
    logo: createdData.logo || meta.logo || '',
    startDate: createdData.start_date || meta.startDate || '',
    endDate: createdData.end_date || meta.endDate || '',
    description: createdData.description || meta.description || '',
    teamsCount: 0,
    matchesCount: 0,
    knockoutStartingRound: createdData.knockout_starting_round || 'sf',
    isUserPortalEnabled: true,
    createdAt: createdData.created_at || Date.now(),
    updatedAt: createdData.updated_at || Date.now(),
  };

  return newItem;
}

/**
 * Update tournament settings via Backend API v1
 */
export async function updateTournamentMeta(
  tournamentId: string,
  meta: Partial<TournamentItem>
): Promise<boolean> {
  try {
    await tournamentService.update(tournamentId, {
      name: meta.name,
      description: meta.description,
      logo: meta.logo,
      start_date: meta.startDate,
      end_date: meta.endDate,
      knockout_starting_round: meta.knockoutStartingRound,
      is_user_portal_enabled: meta.isUserPortalEnabled,
    });
    return true;
  } catch (err) {
    console.error('[dbService] Backend updateTournamentMeta failed:', err);
    return false;
  }
}

/**
 * Delete tournament via Backend API v1
 */
export async function deleteTournament(tournamentId: string): Promise<boolean> {
  if (tournamentId === DEFAULT_TOURNAMENT_ID) {
    return false; // protect primary tournament
  }

  try {
    await tournamentService.delete(tournamentId);
    return true;
  } catch (err) {
    console.error('[dbService] Backend deleteTournament failed:', err);
    return false;
  }
}

/**
 * Fetch full tournament database from Backend API v1 (Single Source of Truth)
 */
export async function fetchDatabase(
  tournamentId: string = DEFAULT_TOURNAMENT_ID,
  signal?: AbortSignal
): Promise<TournamentDatabaseData> {
  try {
    // 1. Fetch from Backend API v1
    const [tourneyRes, teamsRes, matchesRes, bracketRes] = await Promise.all([
      tournamentService.getById(tournamentId, signal),
      teamService.getByTournament(tournamentId, signal),
      matchService.getByTournament(tournamentId, undefined, signal),
      tournamentService.getBracket(tournamentId, signal),
    ]);

    if (tourneyRes) {
      const teams = (teamsRes || []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
        nameEn: t.name,
        shortName: t.short_name || t.name.slice(0, 3).toUpperCase(),
        group: t.group_name || 'Group A',
        logo: t.logo || getPersistedLogo(t.id, t.name) || '',
        players: [],
      }));

      // Group teams by group_name
      const groups: GroupMap = {};
      for (const t of teams) {
        const gName = t.group || 'Group A';
        if (!groups[gName]) groups[gName] = [];
        groups[gName].push(t);
      }

      const matches: Match[] = (matchesRes || []).map((m: any) => {
        const team1 = teams.find((t) => String(t.id) === String(m.home_team_id)) || {
          id: String(m.home_team_id),
          name: 'ทีมเหย้า',
          shortName: 'HOM',
          logo: '',
          players: [],
        };
        const team2 = teams.find((t) => String(t.id) === String(m.away_team_id)) || {
          id: String(m.away_team_id),
          name: 'ทีมเยือน',
          shortName: 'AWY',
          logo: '',
          players: [],
        };

        return {
          id: String(m.id),
          tournamentId,
          matchday: m.matchday || 1,
          round: m.round || (m.stage === 'knockout' ? 'รอบน็อคเอาท์' : 'รอบแบ่งกลุ่ม (Group Stage)'),
          stage: m.stage || 'group',
          group: m.group_name || 'Group A',
          dateStr: m.match_date || '',
          timeStr: m.match_time || '',
          venue: m.pitch || 'สนามหลัก',
          team1,
          team2,
          score1: m.home_score !== null && m.home_score !== undefined ? Number(m.home_score) : 0,
          score2: m.away_score !== null && m.away_score !== undefined ? Number(m.away_score) : 0,
          penaltyScore1: m.home_penalty_score,
          penaltyScore2: m.away_penalty_score,
          status: m.status || 'SCHEDULED',
        };
      });

      const bracketData = bracketRes?.bracket_data || tourneyRes.bracket_data || {};

      const formatted: TournamentDatabaseData = {
        id: tournamentId,
        tournamentName: tourneyRes.name || '',
        status: tourneyRes.status || 'ACTIVE',
        startDate: tourneyRes.start_date || '',
        endDate: tourneyRes.end_date || '',
        description: tourneyRes.description || '',
        teams,
        groups,
        matches,
        knockoutStartingRound: tourneyRes.knockout_starting_round || 'sf',
        r16Matches: bracketData.r16Matches || INITIAL_R16_MATCHES,
        qfMatches: bracketData.qfMatches || INITIAL_QF_MATCHES,
        sfMatches: bracketData.sfMatches || INITIAL_SF_MATCHES,
        finalMatch: bracketData.finalMatch || INITIAL_FINAL_MATCH,
        isBracketLocked: Boolean(tourneyRes.is_bracket_locked),
        isKnockoutCreated: Boolean(tourneyRes.is_knockout_created),
        isUserPortalEnabled: tourneyRes.is_user_portal_enabled !== undefined ? Boolean(tourneyRes.is_user_portal_enabled) : true,
        updatedAt: Date.now(),
      };

      return formatted;
    }
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      return loadDatabaseSync(tournamentId);
    }
    console.warn(`[dbService] Backend fetch failed for "${tournamentId}":`, err);
  }

  return { ...DEFAULT_DATABASE_DATA, id: tournamentId, _isOfflineFallback: true } as any;
}

/**
 * Save tournament database to Backend API v1
 */
export async function saveDatabase(
  data: TournamentDatabaseData,
  tournamentId: string = DEFAULT_TOURNAMENT_ID
): Promise<boolean> {
  // Only authenticated admins can write to backend database
  if (!apiClient.getToken()) {
    return false;
  }

  if (Array.isArray(data.teams)) {
    persistAllTeamLogos(data.teams);
  }

  // Call Backend API directly - Only Backend saves to database, no local storage saving
  try {
    await tournamentService.update(tournamentId, {
      name: data.tournamentName,
      status: data.status,
      logo: data.logo,
      start_date: data.startDate,
      end_date: data.endDate,
      description: data.description,
      knockout_starting_round: data.knockoutStartingRound,
      is_user_portal_enabled: data.isUserPortalEnabled,
      bracket_data: {
        r16Matches: data.r16Matches,
        qfMatches: data.qfMatches,
        sfMatches: data.sfMatches,
        finalMatch: data.finalMatch,
        groups: data.groups,
      },
    });

    return true;
  } catch (err) {
    console.error('[dbService] Backend saveDatabase error:', err);
    return false;
  }
}

/**
 * Reset database
 */
export async function resetDatabase(tournamentId: string = DEFAULT_TOURNAMENT_ID): Promise<boolean> {
  try {
    await apiClient.post('/api/db/reset');
  } catch {}
  return true;
}
