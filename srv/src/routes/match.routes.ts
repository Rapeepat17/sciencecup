import { Router } from 'express';
import {
  listMatches,
  getMatch,
  createMatch,
  updateMatchScore,
  addMatchEvent,
  getMatchEvents,
  getStandings,
} from '../controllers/match.controller.ts';
import { authenticate, requireTournament, requireTournamentRole } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { tournamentIdParamSchema } from '../schemas/tournament.schema.ts';
import { matchIdParamSchema, updateMatchScoreSchema, createMatchSchema } from '../schemas/match.schema.ts';

const router = Router({ mergeParams: true });

// Ensure tournamentId is present on all requests
router.use(requireTournament);

// Public routes
router.get('/', validate({ params: tournamentIdParamSchema }), listMatches);
router.get('/standings', validate({ params: tournamentIdParamSchema }), getStandings);
router.get('/:matchId', validate({ params: matchIdParamSchema }), getMatch);
router.get('/:matchId/events', validate({ params: matchIdParamSchema }), getMatchEvents);

// Protected routes (scorekeepers, admins, owners)
router.post(
  '/',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: createMatchSchema }),
  createMatch
);

router.patch(
  '/:matchId',
  authenticate,
  requireTournamentRole(['scorekeeper', 'admin', 'owner']),
  validate({ params: matchIdParamSchema, body: updateMatchScoreSchema }),
  updateMatchScore
);

router.patch(
  '/:matchId/result',
  authenticate,
  requireTournamentRole(['scorekeeper', 'admin', 'owner']),
  validate({ params: matchIdParamSchema, body: updateMatchScoreSchema }),
  updateMatchScore
);

router.patch(
  '/:matchId/score',
  authenticate,
  requireTournamentRole(['scorekeeper', 'admin', 'owner']),
  validate({ params: matchIdParamSchema, body: updateMatchScoreSchema }),
  updateMatchScore
);

router.post(
  '/:matchId/events',
  authenticate,
  requireTournamentRole(['scorekeeper', 'admin', 'owner']),
  validate({ params: matchIdParamSchema }),
  addMatchEvent
);

export default router;
