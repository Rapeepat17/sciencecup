import { apiClient } from './apiClient';
import { TournamentItem } from '../types';

export interface CreateTournamentDto {
  id?: string;
  name: string;
  description?: string;
  logo?: string;
  start_date?: string;
  end_date?: string;
  knockout_starting_round?: 'r16' | 'qf' | 'sf' | 'final';
  is_user_portal_enabled?: boolean;
}

export const tournamentService = {
  getAll: (signal?: AbortSignal): Promise<TournamentItem[]> => {
    return apiClient.get<TournamentItem[]>('/api/v1/tournaments', { signal });
  },

  getById: (id: string, signal?: AbortSignal): Promise<any> => {
    return apiClient.get<any>(`/api/v1/tournaments/${id}`, { signal });
  },

  create: (data: CreateTournamentDto): Promise<any> => {
    return apiClient.post<any>('/api/v1/tournaments', data);
  },

  update: (id: string, data: Partial<CreateTournamentDto> & { status?: string; bracket_data?: any }): Promise<any> => {
    return apiClient.patch<any>(`/api/v1/tournaments/${id}`, data);
  },

  delete: (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/v1/tournaments/${id}`);
  },

  getBracket: (id: string, signal?: AbortSignal): Promise<any> => {
    return apiClient.get<any>(`/api/v1/tournaments/${id}/bracket`, { signal });
  },

  updateBracket: (id: string, data: any): Promise<any> => {
    return apiClient.patch<any>(`/api/v1/tournaments/${id}/bracket`, data);
  },
};
