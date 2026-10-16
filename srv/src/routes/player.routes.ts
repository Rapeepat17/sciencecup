import { Router } from 'express';
import {
  listPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '../controllers/player.controller.ts';
import { authenticate, requireTournament, requireTournamentRole } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { tournamentIdParamSchema } from '../schemas/tournament.schema.ts';
import { playerIdParamSchema, createPlayerSchema, updatePlayerSchema } from '../schemas/player.schema.ts';

const router = Router({ mergeParams: true });

router.use(requireTournament);

// Public routes
router.get('/', validate({ params: tournamentIdParamSchema }), listPlayers);
router.get('/:playerId', validate({ params: playerIdParamSchema }), getPlayer);

// Protected routes (admin/owner)
router.post(
  '/',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: tournamentIdParamSchema, body: createPlayerSchema }),
  createPlayer
);

router.patch(
  '/:playerId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: playerIdParamSchema, body: updatePlayerSchema }),
  updatePlayer
);

router.delete(
  '/:playerId',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  validate({ params: playerIdParamSchema }),
  deletePlayer
);

export default router;
