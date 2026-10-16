import express, { Express, Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './middleware/cors.middleware.ts';
import { requestLogger } from './middleware/requestLogger.ts';
import { rateLimiter } from './middleware/rateLimiter.ts';
import { errorHandler, AppError } from './middleware/errorHandler.ts';
import apiRoutes from './routes/index.ts';

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy for rate limiting if behind reverse proxy
  app.set('trust proxy', 1);

  // 2. Global Middlewares
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);
  app.use(rateLimiter());

  // 3. API Routes
  app.use('/api', apiRoutes);

  // 4. Handle 404 for undefined routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(AppError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
  });

  // 5. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
