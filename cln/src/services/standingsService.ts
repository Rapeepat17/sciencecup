import { apiClient } from './apiClient';

export interface GroupStandingItem {
  rank: number;
  isQualified: boolean;
  teamId: string;
  teamName: string;
  shortName?: string | null;
  teamLogo?: string | null;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

export interface TournamentStandingsSummary {
  totalGroups: number;
  totalTeamsInGroups: number;
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  totalGoals: number;
}

export interface TournamentStandingsResponse {
  groups: Record<string, GroupStandingItem[]>;
  summary: TournamentStandingsSummary;
}

export const standingsService = {
  getByTournament: (
    tournamentId: string,
    signal?: AbortSignal
  ): Promise<TournamentStandingsResponse> => {
    return apiClient.get<TournamentStandingsResponse>(
      `/api/v1/tournaments/${tournamentId}/standings`,
      { signal }
    );
  },
};
