import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.ts';

const allowlist = env.CORS_ORIGINS.split(',').map((origin) => origin.trim().toLowerCase());

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  if (!origin) {
    // Non-browser or server-to-server request
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    const isAllowed =
      env.NODE_ENV === 'development' ||
      allowlist.includes(origin.toLowerCase()) ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tournament-Id, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
