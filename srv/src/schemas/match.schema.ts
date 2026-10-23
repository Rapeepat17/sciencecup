import { z } from 'zod';

export const matchIdParamSchema = z.object({
  tournamentId: z.string().min(1),
  matchId: z.string().min(1),
});

export const updateMatchScoreSchema = z.object({
  home_score: z.number().int().min(0).max(99).nullable().optional(),
  away_score: z.number().int().min(0).max(99).nullable().optional(),
  home_penalty_score: z.number().int().min(0).max(99).nullable().optional(),
  away_penalty_score: z.number().int().min(0).max(99).nullable().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'POSTPONED']).optional(),
  match_date: z.string().nullable().optional(),
  match_time: z.string().nullable().optional(),
  pitch: z.string().nullable().optional(),
});

export const createMatchSchema = z.object({
  id: z.string().min(1).optional(),
  stage: z.enum(['group', 'qf', 'sf', 'final']),
  group_name: z.string().nullable().optional(),
  home_team_id: z.string().min(1),
  away_team_id: z.string().min(1),
  match_date: z.string().nullable().optional(),
  match_time: z.string().nullable().optional(),
  pitch: z.string().nullable().optional(),
});
