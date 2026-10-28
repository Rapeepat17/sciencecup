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
  status: z.enum(['SCHEDULED', 'UPCOMING', 'LIVE', 'COMPLETED', 'FT', 'POSTPONED']).optional(),
  match_date: z.string().nullable().optional(),
  match_time: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  pitch: z.string().nullable().optional(),
  match_number: z.number().int().min(1).nullable().optional(),
  matchday: z.number().int().min(1).nullable().optional(),
  round_name: z.string().nullable().optional(),
  group_name: z.string().nullable().optional(),
});

export const createMatchSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  stage: z.enum(['group', 'r16', 'qf', 'sf', 'third_place', 'final']).optional().default('group'),
  round_name: z.string().nullable().optional(),
  group_name: z.string().nullable().optional(),
  home_team_id: z.union([z.string(), z.number()]),
  away_team_id: z.union([z.string(), z.number()]),
  match_number: z.number().int().min(1).optional(),
  matchday: z.number().int().min(1).optional(),
  match_date: z.string().nullable().optional(),
  match_time: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  pitch: z.string().nullable().optional(),
});

export const syncMatchItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  match_number: z.number().int().min(1).optional(),
  matchday: z.number().int().min(1).optional().default(1),
  stage: z.string().optional().default('group'),
  round_name: z.string().nullable().optional(),
  group_name: z.string().nullable().optional(),
  home_team_id: z.union([z.string(), z.number()]),
  away_team_id: z.union([z.string(), z.number()]),
  match_date: z.string().nullable().optional(),
  match_time: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  status: z.string().optional(),
  home_score: z.number().nullable().optional(),
  away_score: z.number().nullable().optional(),
  home_penalty_score: z.number().nullable().optional(),
  away_penalty_score: z.number().nullable().optional(),
});

export const syncMatchesSchema = z.object({
  matches: z.array(syncMatchItemSchema),
});
