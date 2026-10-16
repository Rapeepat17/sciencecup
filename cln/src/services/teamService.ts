import { apiClient } from './apiClient';
import { Team } from '../types';

export const teamService = {
  getByTournament: (tournamentId: string, signal?: AbortSignal): Promise<Team[]> => {
    return apiClient.get<Team[]>(`/api/v1/tournaments/${tournamentId}/teams`, { signal });
  },

  getById: (tournamentId: string, teamId: string, signal?: AbortSignal): Promise<Team> => {
    return apiClient.get<Team>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`, { signal });
  },

  create: (tournamentId: string, team: { id: string; name: string; group_name: string; logo?: string | null }): Promise<Team> => {
    return apiClient.post<Team>(`/api/v1/tournaments/${tournamentId}/teams`, team);
  },

  update: (tournamentId: string, teamId: string, team: Partial<Team>): Promise<Team> => {
    return apiClient.patch<Team>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`, team);
  },

  delete: (tournamentId: string, teamId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`);
  },
};
