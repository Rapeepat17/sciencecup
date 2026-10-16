import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.ts';
import { ApiErrorResponse } from '../types/api.types.ts';

interface ClientRecord {
  count: number;
  resetTime: number;
}

const clientRecords = new Map<string, ClientRecord>();

// Periodic garbage collection every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of clientRecords.entries()) {
    if (now > record.resetTime) {
      clientRecords.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function rateLimiter(
  windowMs = env.RATE_LIMIT_WINDOW_MS,
  maxRequests = env.RATE_LIMIT_MAX_REQUESTS
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Exclude health endpoint or OPTIONS requests
    if (req.path === '/api/health' || req.method === 'OPTIONS') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();
    let record = clientRecords.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      clientRecords.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(429).json(response);
      return;
    }

    next();
  };
}

// Helper to reset limits during testing
export function _resetRateLimiter(): void {
  clientRecords.clear();
}
