import { Router } from 'express';
import {
  listTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  getGroups,
  createGroup,
  renameGroup,
  deleteGroup,
  updateGroups,
  getBracket,
  updateBracket,
  autoSeedBracket,
  getStandings,
} from '../controllers/tournament.controller.ts';
import { authenticate, requireTournamentRole } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import {
  createTournamentSchema,
  updateTournamentSchema,
  tournamentIdParamSchema,
  updateGroupsSchema,
} from '../schemas/tournament.schema.ts';

const router = Router();

// Public routes
router.get('/', listTournaments);
router.get('/:tournamentId', validate({ params: tournamentIdParamSchema }), getTournament);
router.get('/:tournamentId/groups', validate({ params: tournamentIdParamSchema }), getGroups);
router.get('/:tournamentId/standings', validate({ params: tournamentIdParamSchema }), getStandings);
router.get('/:tournamentId/bracket', validate({ params: tournamentIdParamSchema }), getBracket);

// Protected routes (require auth)
router.post('/', authenticate, validate({ body: createTournamentSchema }), createTournament);
router.put(
  '/:tournamentId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: updateTournamentSchema }),
  updateTournament
);
router.patch(
  '/:tournamentId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: updateTournamentSchema }),
  updateTournament
);
router.put(
  '/:tournamentId/groups',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: updateGroupsSchema }),
  updateGroups
);
router.patch(
  '/:tournamentId/groups',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: updateGroupsSchema }),
  updateGroups
);
router.post(
  '/:tournamentId/groups',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema }),
  createGroup
);
router.patch(
  '/:tournamentId/groups/:groupId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema }),
  renameGroup
);
router.delete(
  '/:tournamentId/groups/:groupId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema }),
  deleteGroup
);
router.patch(
  '/:tournamentId/bracket',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema }),
  updateBracket
);
router.post(
  '/:tournamentId/bracket/auto-seed',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema }),
  autoSeedBracket
);
router.delete(
  '/:tournamentId',
  authenticate,
  requireTournamentRole(['owner']),
  validate({ params: tournamentIdParamSchema }),
  deleteTournament
);

export default router;
