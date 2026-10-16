import { Router } from 'express';
import healthRoutes from './health.routes.ts';
import tournamentRoutes from './tournament.routes.ts';
import teamRoutes from './team.routes.ts';
import matchRoutes from './match.routes.ts';
import playerRoutes from './player.routes.ts';
import imageRoutes from './image.routes.ts';
import authRoutes from './auth.routes.ts';

const router = Router();

// ==========================================
// API v1 Router Definition
// ==========================================
const v1Router = Router();

// Health check endpoint (/api/v1/health)
v1Router.use('/', healthRoutes);

// Auth endpoints (/api/v1/auth/login, /register, /me, /logout)
v1Router.use('/auth', authRoutes);

// Tournaments CRUD, Groups, and Brackets (/api/v1/tournaments)
v1Router.use('/tournaments', tournamentRoutes);

// Tournament-scoped subresources
v1Router.use('/tournaments/:tournamentId/teams', teamRoutes);
v1Router.use('/tournaments/:tournamentId/matches', matchRoutes);
v1Router.use('/tournaments/:tournamentId/players', playerRoutes);
v1Router.use('/tournaments/:tournamentId/images', imageRoutes);

// Standings alias (/api/v1/tournaments/:tournamentId/standings) is handled inside matchRoutes

// Mount API v1 router
router.use('/v1', v1Router);

// Alias root /api directly to v1Router for flexible access
router.use('/', v1Router);

export default router;
