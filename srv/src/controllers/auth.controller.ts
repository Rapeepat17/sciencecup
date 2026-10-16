import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.ts';
import { ApiResponse } from '../types/api.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await authService.login(req.body);
    const response: ApiResponse = {
      success: true,
      data: session,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    const response: ApiResponse = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      throw AppError.unauthorized('Not authenticated');
    }

    // Support mock dev admin user
    if (req.user.id === '00000000-0000-0000-0000-000000000001') {
      const response: ApiResponse = {
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          username: 'superadmin',
          role: 'admin',
          tournaments: [{ tournament_id: 'sci_cup_main', role: 'owner' }],
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.json(response);
      return;
    }

    const profile = await authService.getCurrentUser(req.user.id);
    const response: ApiResponse = {
      success: true,
      data: profile,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export function logout(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: true,
    data: { message: 'Logged out successfully' },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
}
