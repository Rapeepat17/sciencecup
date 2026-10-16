import { Request, Response, NextFunction } from 'express';
import { imageService } from '../services/image.service.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { ApiResponse } from '../types/api.types.ts';

/**
 * Controller to handle uploading and saving team logo
 */
export async function uploadTeamLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const { imageBase64, teamId } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw AppError.badRequest('imageBase64 is required and must be a valid base64 data URL');
    }

    if (!teamId || typeof teamId !== 'string') {
      throw AppError.badRequest('teamId is required');
    }

    const result = await imageService.uploadAndSaveTeamLogo(
      tournamentId,
      teamId.trim(),
      imageBase64
    );

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

/**
 * Controller to safely delete team logo (DB + Supabase Storage)
 */
export async function deleteTeamLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const teamId = (req.query.teamId as string) || (req.body && req.body.teamId);

    if (!teamId || typeof teamId !== 'string') {
      throw AppError.badRequest('teamId is required in query or body');
    }

    await imageService.deleteTeamLogo(tournamentId, teamId.trim());

    const response: ApiResponse = {
      success: true,
      data: {
        message: `Logo for team "${teamId}" removed successfully`,
        tournamentId,
        teamId,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to trigger Base64-to-Storage migration
 */
export async function migrateLegacyLogos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const report = await imageService.migrateLegacyBase64Logos(tournamentId);

    const response: ApiResponse = {
      success: true,
      data: report,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
