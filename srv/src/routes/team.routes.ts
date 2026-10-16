import { Router } from 'express';
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/team.controller.ts';
import { authenticate, requireTournament, requireTournamentRole } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { tournamentIdParamSchema } from '../schemas/tournament.schema.ts';
import { teamIdParamSchema, createTeamSchema, updateTeamSchema } from '../schemas/team.schema.ts';

const router = Router({ mergeParams: true });

// Ensure tournamentId is present on all requests
router.use(requireTournament);

// Public routes
router.get('/', validate({ params: tournamentIdParamSchema }), listTeams);
router.get('/:teamId', validate({ params: teamIdParamSchema }), getTeam);

// Protected routes (admin/owner)
router.post(
  '/',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: createTeamSchema }),
  createTeam
);

router.put(
  '/:teamId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: teamIdParamSchema, body: updateTeamSchema }),
  updateTeam
);

router.patch(
  '/:teamId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: teamIdParamSchema, body: updateTeamSchema }),
  updateTeam
);

router.delete(
  '/:teamId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: teamIdParamSchema }),
  deleteTeam
);

export default router;
