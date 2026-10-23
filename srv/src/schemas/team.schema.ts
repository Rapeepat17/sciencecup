import { z } from 'zod';

export const teamIdParamSchema = z.object({
  tournamentId: z.string().min(1),
  teamId: z.string().min(1),
});

export const createTeamSchema = z.object({
  id: z.string().min(1).max(50).optional(),
  name: z.string().min(1, 'Team name is required').max(100),
  short_name: z.string().max(20).nullable().optional(),
  manager: z.string().max(100).nullable().optional(),
  group_name: z.string().max(20).nullable().optional(),
  logo: z.string().nullable().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  short_name: z.string().max(20).nullable().optional(),
  manager: z.string().max(100).nullable().optional(),
  group_name: z.string().min(1).max(20).optional(),
  logo: z.string().nullable().optional(),
});
