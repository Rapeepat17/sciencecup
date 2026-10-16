import { Router } from 'express';
import { uploadTeamLogo, deleteTeamLogo, migrateLegacyLogos } from '../controllers/image.controller.ts';
import { authenticate, requireTournament, requireTournamentRole } from '../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

router.use(requireTournament);

// Upload logo requires admin/owner role
router.post(
  '/upload',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  uploadTeamLogo
);

// Delete logo requires admin/owner role
router.delete(
  '/',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  deleteTeamLogo
);

// Trigger migration requires admin/owner role
router.post(
  '/migrate',
  authenticate,
  requireTournamentRole(['admin', 'owner']),
  migrateLegacyLogos
);

export default router;
