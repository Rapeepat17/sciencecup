import { apiClient } from './apiClient';
import { GroupMap } from '../types';

export const groupService = {
  getByTournament: (tournamentId: string, signal?: AbortSignal): Promise<GroupMap> => {
    return apiClient.get<GroupMap>(`/api/v1/tournaments/${tournamentId}/groups`, { signal });
  },
};
