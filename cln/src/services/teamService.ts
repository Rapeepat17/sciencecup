import { apiClient } from './apiClient';
import { Team } from '../types';

export const teamService = {
  getByTournament: (tournamentId: string, signal?: AbortSignal): Promise<Team[]> => {
    return apiClient.get<Team[]>(`/api/v1/tournaments/${tournamentId}/teams`, { signal });
  },

  getById: (tournamentId: string, teamId: string, signal?: AbortSignal): Promise<Team> => {
    return apiClient.get<Team>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`, { signal });
  },

  create: (tournamentId: string, team: { id?: string; name: string; group_name?: string | null; logo?: string | null; short_name?: string | null; shortName?: string | null; manager?: string | null }): Promise<Team> => {
    const payload = {
      ...team,
      short_name: team.short_name !== undefined ? team.short_name : (team.shortName || null),
    };
    return apiClient.post<Team>(`/api/v1/tournaments/${tournamentId}/teams`, payload);
  },

  update: (tournamentId: string, teamId: string, team: Partial<Team>): Promise<Team> => {
    const payload = {
      ...team,
      short_name: (team as any).short_name !== undefined ? (team as any).short_name : (team.shortName || null),
    };
    return apiClient.patch<Team>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`, payload);
  },

  delete: (tournamentId: string, teamId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`);
  },
};
