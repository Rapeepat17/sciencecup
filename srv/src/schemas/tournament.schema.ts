import { z } from 'zod';

export const tournamentIdParamSchema = z.object({
  tournamentId: z.string().min(1, 'Tournament ID cannot be empty').regex(/^[a-zA-Z0-9_-]+$/, 'Invalid tournament ID format'),
});

export const createTournamentSchema = z.object({
  id: z
    .string()
    .min(3, 'Tournament ID must be at least 3 characters')
    .max(50, 'Tournament ID cannot exceed 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Tournament ID must be lowercase letters, numbers, hyphens or underscores'),
  name: z.string().min(2, 'Tournament name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  knockout_starting_round: z.enum(['qf', 'sf', 'final']).default('sf'),
  is_user_portal_enabled: z.boolean().default(true),
});

export const updateTournamentSchema = createTournamentSchema
  .omit({ id: true })
  .partial()
  .extend({
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
    is_bracket_locked: z.boolean().optional(),
    is_knockout_created: z.boolean().optional(),
    bracket_data: z.record(z.string(), z.any()).optional(),
  });
