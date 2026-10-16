import { getSupabaseClient } from '../config/supabase.ts';
import { env } from '../config/env.ts';
import { AppError } from '../middleware/errorHandler.ts';

export interface AuthSessionResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username?: string;
    role: string;
    tournaments: {
      tournamentId: string;
      role: string;
    }[];
  };
}

export class AuthService {
  async login(payload: { email: string; password: string }): Promise<AuthSessionResponse> {
    const { email, password } = payload;
    const supabase = getSupabaseClient();

    // 1. Development fallback login
    const isDevAdminEmail = email === 'admin@scicup.local' || email === 'admin';
    const isDevAdminPassword = ['Admin@2026', 'dev_admin_password', '1234', 'admin', 'scicup2026'].includes(password);
    if (env.NODE_ENV !== 'production' && isDevAdminEmail && isDevAdminPassword) {
      return {
        accessToken: 'dev_admin_token',
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@scicup.local',
          username: 'superadmin',
          role: 'admin',
          tournaments: [
            { tournamentId: 'sci_cup_main', role: 'owner' },
          ],
        },
      };
    }

    // 2. Real Supabase Auth verification
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const userId = data.user.id;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', userId)
      .maybeSingle();

    // Fetch tournament memberships
    const { data: memberships } = await supabase
      .from('tournament_members')
      .select('tournament_id, role')
      .eq('profile_id', userId);

    const tournamentRoles = (memberships || []).map((m: any) => ({
      tournamentId: m.tournament_id,
      role: m.role,
    }));

    return {
      accessToken: data.session.access_token,
      user: {
        id: userId,
        email: data.user.email || email,
        username: profile?.username || email.split('@')[0],
        role: profile?.role || 'user',
        tournaments: tournamentRoles,
      },
    };
  }

  async register(payload: { email: string; password: string; username: string; fullName?: string }): Promise<{ message: string; userId?: string }> {
    const { email, password, username } = payload;
    const supabase = getSupabaseClient();

    // Enforce default role 'user' strictly (privilege escalation prevention)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role: 'user', // strictly non-admin
        },
      },
    });

    if (error) {
      throw AppError.badRequest(error.message, 'REGISTRATION_FAILED');
    }

    if (data.user) {
      // Create profile record with default 'user' role
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email,
        password_hash: '[MANAGED_BY_SUPABASE_AUTH]',
        role: 'user',
      });
    }

    return {
      message: 'Registration successful. Please verify your email if required or proceed to login.',
      userId: data.user?.id,
    };
  }

  async getCurrentUser(userId: string): Promise<any> {
    const supabase = getSupabaseClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) {
      throw AppError.notFound('User profile not found');
    }

    const { data: memberships } = await supabase
      .from('tournament_members')
      .select('tournament_id, role')
      .eq('profile_id', userId);

    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role,
      tournaments: memberships || [],
    };
  }
}

export const authService = new AuthService();
