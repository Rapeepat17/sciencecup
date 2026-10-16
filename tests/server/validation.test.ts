import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createTournamentSchema,
  updateTournamentSchema,
  tournamentIdParamSchema,
} from '../../srv/src/schemas/tournament.schema.ts';
import { createTeamSchema } from '../../srv/src/schemas/team.schema.ts';
import { updateMatchScoreSchema } from '../../srv/src/schemas/match.schema.ts';

describe('Zod Validation Schemas', () => {
  describe('Tournament Schemas', () => {
    test('should accept valid tournament creation payload', () => {
      const valid = {
        id: 'sci_cup_2026',
        name: 'SCI CUP 2026',
        description: 'Annual Faculty Cup',
        knockout_starting_round: 'sf',
        is_user_portal_enabled: true,
      };
      const res = createTournamentSchema.safeParse(valid);
      assert.strictEqual(res.success, true);
    });

    test('should reject invalid tournament ID with special characters', () => {
      const invalid = {
        id: 'INVALID/ID!@#',
        name: 'Bad Tournament',
      };
      const res = createTournamentSchema.safeParse(invalid);
      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('id')));
      }
    });

    test('should validate tournamentId param', () => {
      assert.strictEqual(tournamentIdParamSchema.safeParse({ tournamentId: 'sci_cup_main' }).success, true);
      assert.strictEqual(tournamentIdParamSchema.safeParse({ tournamentId: '' }).success, false);
    });
  });

  describe('Team Schemas', () => {
    test('should accept valid team', () => {
      const valid = {
        id: 'team_bio',
        name: 'Biology FC',
        group_name: 'A',
      };
      assert.strictEqual(createTeamSchema.safeParse(valid).success, true);
    });

    test('should reject team without name or group', () => {
      assert.strictEqual(createTeamSchema.safeParse({ id: 'team_x' }).success, false);
    });
  });

  describe('Match Schemas', () => {
    test('should accept valid match score update', () => {
      const valid = {
        home_score: 3,
        away_score: 1,
        status: 'COMPLETED',
      };
      assert.strictEqual(updateMatchScoreSchema.safeParse(valid).success, true);
    });

    test('should reject negative scores', () => {
      const invalid = {
        home_score: -1,
        away_score: 2,
      };
      assert.strictEqual(updateMatchScoreSchema.safeParse(invalid).success, false);
    });
  });
});
