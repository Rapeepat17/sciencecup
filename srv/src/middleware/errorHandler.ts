import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiErrorResponse } from '../types/api.types.ts';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: any[];

  constructor(statusCode: number, message: string, errorCode: string = 'BAD_REQUEST', details?: any[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, errorCode = 'BAD_REQUEST', details?: any[]): AppError {
    return new AppError(400, message, errorCode, details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string, errorCode = 'CONFLICT'): AppError {
    return new AppError(409, message, errorCode);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, message, 'INTERNAL_SERVER_ERROR');
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details,
        timestamp,
      },
    };
    res.status(400).json(response);
    return;
  }

  // 2. Custom AppError
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
        timestamp,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 3. PostgreSQL / Supabase Errors
  if (err && err.code) {
    let statusCode = 400;
    let code = 'DATABASE_ERROR';
    let message = err.message || 'Database error occurred';

    // Unique constraint violation
    if (err.code === '23505') {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      message = 'A record with this identifier already exists';
    } else if (err.code === '23503') {
      // Foreign key violation
      statusCode = 400;
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'Referenced tournament, team, or parent record does not exist';
    } else if (err.code === 'P0001') {
      // Trigger error (e.g. cross tournament integrity trigger)
      statusCode = 400;
      code = 'INTEGRITY_VIOLATION';
      message = err.message || 'Cross-tournament integrity check failed';
    }

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp,
      },
    };
    res.status(statusCode).json(response);
    return;
  }

  // 4. Default / Unhandled Errors
  console.error('[Unhandled Error]:', err);
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      timestamp,
    },
  };
  res.status(500).json(response);
}
