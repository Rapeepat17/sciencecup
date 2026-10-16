import { Request, Response, NextFunction } from 'express';
import { playerService } from '../services/player.service.ts';
import { ApiResponse } from '../types/api.types.ts';

export async function listPlayers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const teamId = req.query.teamId as string | undefined;
    const players = await playerService.getPlayers(tournamentId, teamId);
    const response: ApiResponse = {
      success: true,
      data: players,
      meta: {
        total: players.length,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getPlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, playerId } = req.params;
    const player = await playerService.getPlayerById(tournamentId, playerId);
    const response: ApiResponse = {
      success: true,
      data: player,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createPlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const player = await playerService.createPlayer(tournamentId, req.body);
    const response: ApiResponse = {
      success: true,
      data: player,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updatePlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, playerId } = req.params;
    const player = await playerService.updatePlayer(tournamentId, playerId, req.body);
    const response: ApiResponse = {
      success: true,
      data: player,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deletePlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, playerId } = req.params;
    await playerService.deletePlayer(tournamentId, playerId);
    const response: ApiResponse = {
      success: true,
      data: { message: `Player "${playerId}" deleted successfully` },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}
