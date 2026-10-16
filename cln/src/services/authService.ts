import { apiClient, USER_STORAGE_KEY } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role: string;
  tournaments?: {
    tournament_id?: string;
    tournamentId?: string;
    role: string;
  }[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
    if (res.accessToken) {
      apiClient.setToken(res.accessToken);
    }
    if (res.user) {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      } catch {}
    }
    return res;
  },

  async register(data: { email: string; password: string; username: string; fullName?: string }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/v1/auth/register', data);
  },

  async getMe(): Promise<AuthUser> {
    const user = await apiClient.get<AuthUser>('/api/v1/auth/me');
    if (user) {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {}
    }
    return user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {}
    apiClient.clearToken();
  },

  getCachedUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  },

  isAuthenticated(): boolean {
    return Boolean(apiClient.getToken());
  },

  isGlobalAdmin(): boolean {
    const user = this.getCachedUser();
    return user?.role === 'admin' || user?.role === 'superadmin';
  },

  hasTournamentAccess(tournamentId: string): boolean {
    if (this.isGlobalAdmin()) return true;
    const user = this.getCachedUser();
    if (!user || !user.tournaments) return false;
    return user.tournaments.some(
      (t) => (t.tournamentId === tournamentId || t.tournament_id === tournamentId) && ['owner', 'admin', 'scorekeeper'].includes(t.role)
    );
  },
};
