import { apiClient } from './apiClient';
import { Match, MatchEvent } from '../types';

export interface SyncMatchItemPayload {
  id?: string | number;
  match_number?: number;
  matchday?: number;
  stage?: string;
  round_name?: string | null;
  group_name?: string | null;
  home_team_id: string | number;
  away_team_id: string | number;
  match_date?: string | null;
  match_time?: string | null;
  venue?: string | null;
  status?: string;
  home_score?: number | null;
  away_score?: number | null;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
}

export const matchService = {
  getByTournament: (tournamentId: string, stage?: string, signal?: AbortSignal): Promise<Match[]> => {
    const url = `/api/v1/tournaments/${tournamentId}/matches${stage ? `?stage=${stage}` : ''}`;
    return apiClient.get<Match[]>(url, { signal });
  },

  getById: (tournamentId: string, matchId: string, signal?: AbortSignal): Promise<Match & { events: MatchEvent[] }> => {
    return apiClient.get<Match & { events: MatchEvent[] }>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}`, { signal });
  },

  syncMatches: (tournamentId: string, matches: SyncMatchItemPayload[]): Promise<Match[]> => {
    return apiClient.put<Match[]>(`/api/v1/tournaments/${tournamentId}/matches`, { matches });
  },

  create: (tournamentId: string, match: any): Promise<Match> => {
    return apiClient.post<Match>(`/api/v1/tournaments/${tournamentId}/matches`, match);
  },

  update: (tournamentId: string, matchId: string, payload: Partial<Match>): Promise<Match> => {
    return apiClient.patch<Match>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}`, payload);
  },

  recordResult: (
    tournamentId: string,
    matchId: string,
    result: {
      home_score: number | null;
      away_score: number | null;
      home_penalty_score?: number | null;
      away_penalty_score?: number | null;
      status?: string;
    }
  ): Promise<Match> => {
    return apiClient.patch<Match>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}/result`, result);
  },

  getEvents: (tournamentId: string, matchId: string, signal?: AbortSignal): Promise<MatchEvent[]> => {
    return apiClient.get<MatchEvent[]>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}/events`, { signal });
  },

  addEvent: (tournamentId: string, matchId: string, event: Partial<MatchEvent>): Promise<MatchEvent> => {
    return apiClient.post<MatchEvent>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}/events`, event);
  },

  syncMatchGoals: (
    tournamentId: string,
    matchId: string,
    goals: Array<{
      team_id?: string | number | null;
      player_id?: string | null;
      player_number?: string | null;
      player_name?: string | null;
      detail?: string | null;
    }>
  ): Promise<MatchEvent[]> => {
    return apiClient.put<MatchEvent[]>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}/goals`, { goals });
  },

  syncMatchCards: (
    tournamentId: string,
    matchId: string,
    cards: Array<{
      team_id?: string | number | null;
      player_id?: string | null;
      player_number?: string | null;
      player_name?: string | null;
      card_type: 'yellow_card' | 'red_card';
      detail?: string | null;
    }>
  ): Promise<MatchEvent[]> => {
    return apiClient.put<MatchEvent[]>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}/cards`, { cards });
  },

  getTopScorers: async (
    tournamentId: string,
    limit: number = 10,
    signal?: AbortSignal
  ): Promise<
    Array<{
      id: string;
      rank: number;
      name: string;
      number: string;
      teamId: string;
      teamName: string;
      goals: number;
    }>
  > => {
    try {
      return await apiClient.get(`/api/v1/tournaments/${tournamentId}/top-scorers?limit=${limit}`, { signal });
    } catch {
      return apiClient.get(`/api/v1/tournaments/${tournamentId}/matches/top-scorers?limit=${limit}`, { signal });
    }
  },
};
