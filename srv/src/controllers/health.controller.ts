import { Request, Response, NextFunction } from 'express';
import { testSupabaseConnection } from '../config/supabase.ts';
import { ApiResponse } from '../types/api.types.ts';

const startTime = Date.now();

export async function healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dbStatus = await testSupabaseConnection();
    const uptimeSec = Math.floor((Date.now() - startTime) / 1000);

    const isHealthy = dbStatus.connected;
    const statusCode = isHealthy ? 200 : 503;

    const response: ApiResponse = {
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        service: 'sci-cup-backend',
        version: '1.0.0',
        uptimeSeconds: uptimeSec,
        database: {
          type: 'supabase-postgresql',
          status: dbStatus.connected ? 'connected' : 'disconnected',
          latencyMs: dbStatus.latencyMs,
          error: dbStatus.error,
        },
        memoryUsage: process.memoryUsage(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
}
