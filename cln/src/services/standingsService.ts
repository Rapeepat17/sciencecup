import { apiClient } from './apiClient';

export interface GroupStandingItem {
  teamId: string;
  teamName: string;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export const standingsService = {
  getByTournament: (tournamentId: string, signal?: AbortSignal): Promise<Record<string, GroupStandingItem[]>> => {
    return apiClient.get<Record<string, GroupStandingItem[]>>(`/api/v1/tournaments/${tournamentId}/standings`, { signal });
  },
};
