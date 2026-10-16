import { z } from 'zod';

export const playerIdParamSchema = z.object({
  tournamentId: z.string().min(1),
  playerId: z.string().min(1),
});

export const createPlayerSchema = z.object({
  id: z.string().optional(),
  team_id: z.string().min(1, 'team_id is required'),
  name: z.string().min(1, 'Player name is required').max(100),
  number: z.string().max(10).optional().nullable(),
  position: z.string().max(20).optional().nullable(),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  number: z.string().max(10).optional().nullable(),
  position: z.string().max(20).optional().nullable(),
});
