import { apiClient } from './apiClient';
import { Player } from '../types';

export const playerService = {
  getByTournament: (tournamentId: string, teamId?: string, signal?: AbortSignal): Promise<Player[]> => {
    const url = `/api/v1/tournaments/${tournamentId}/players${teamId ? `?teamId=${teamId}` : ''}`;
    return apiClient.get<Player[]>(url, { signal });
  },

  create: (tournamentId: string, player: { team_id: string; name: string; number?: string | number | null }): Promise<Player> => {
    return apiClient.post<Player>(`/api/v1/tournaments/${tournamentId}/players`, {
      ...player,
      number: player.number !== undefined && player.number !== null ? String(player.number) : undefined,
    });
  },

  update: (tournamentId: string, playerId: string, player: Partial<Player>): Promise<Player> => {
    return apiClient.patch<Player>(`/api/v1/tournaments/${tournamentId}/players/${playerId}`, {
      ...player,
      number: player.number !== undefined && player.number !== null ? String(player.number) : undefined,
    });
  },

  delete: (tournamentId: string, playerId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/v1/tournaments/${tournamentId}/players/${playerId}`);
  },
};
