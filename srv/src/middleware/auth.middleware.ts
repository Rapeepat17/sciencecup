import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/supabase.ts';
import { env } from '../config/env.ts';
import { AppError } from './errorHandler.ts';
import { AuthenticatedUser } from '../types/api.types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tournamentId?: string;
    }
  }
}

/**
 * Middleware to extract and verify tournament_id from route params or headers.
 * Ensures that tournament_id is always present and valid.
 */
export async function requireTournament(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tournamentId =
    req.params.tournamentId ||
    req.params.id ||
    (req.headers['x-tournament-id'] as string);

  if (!tournamentId || typeof tournamentId !== 'string') {
    return next(AppError.badRequest('Missing required tournament_id', 'MISSING_TOURNAMENT_ID'));
  }

  // Validate format (alphanumeric, underscores, hyphens)
  if (!/^[a-zA-Z0-9_-]+$/.test(tournamentId)) {
    return next(AppError.badRequest('Invalid tournament_id format', 'INVALID_TOURNAMENT_ID'));
  }

  req.tournamentId = tournamentId;
  next();
}

/**
 * Authenticates user via Bearer token (Supabase Auth).
 * In development and testing, allows demo/admin authorization headers.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authorization token is missing or malformed'));
  }

  const token = authHeader.substring(7).trim();

  // Support development and test tokens
  if (env.NODE_ENV !== 'production') {
    if (token === 'dev_admin_token' || token === '1234') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@scicup.local',
        role: 'admin',
        tournamentRole: 'admin',
      };
      return next();
    }
    if (token === 'dev_viewer_token') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'viewer@scicup.local',
        role: 'user',
        tournamentRole: 'viewer',
      };
      return next();
    }
  }

  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(AppError.unauthorized('Invalid or expired authentication session'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: (user.app_metadata?.role as string) || 'user',
    };

    next();
  } catch (err: any) {
    return next(AppError.unauthorized('Authentication verification failed'));
  }
}

/**
 * Authorizes user role for a specific tournament.
 * Requires user to have 'admin' or 'owner' role in tournament_members, or global admin.
 */
export function requireTournamentRole(allowedRoles: ('owner' | 'admin' | 'scorekeeper' | 'viewer')[] = ['admin', 'owner']) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    // Global admin bypasses per-tournament checks
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    const tournamentId = req.tournamentId || req.params.tournamentId;
    if (!tournamentId) {
      return next(AppError.badRequest('Tournament ID required for role verification'));
    }

    if (req.user.tournamentRole) {
      if (!allowedRoles.includes(req.user.tournamentRole)) {
        return next(AppError.forbidden(`Action requires one of the following roles: ${allowedRoles.join(', ')}`));
      }
      return next();
    }

    try {
      const supabase = getSupabaseClient();
      const { data: member, error } = await supabase
        .from('tournament_members')
        .select('role')
        .eq('tournament_id', tournamentId)
        .eq('profile_id', req.user.id)
        .maybeSingle();

      if (error || !member) {
        return next(AppError.forbidden('You are not a member of this tournament'));
      }

      const role = member.role as 'owner' | 'admin' | 'scorekeeper' | 'viewer';
      if (!allowedRoles.includes(role)) {
        return next(AppError.forbidden(`Action requires one of the following roles: ${allowedRoles.join(', ')}`));
      }

      req.user.tournamentRole = role;
      next();
    } catch (err) {
      return next(AppError.internal('Failed to verify tournament permissions'));
    }
  };
}
