import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service.ts';
import { ApiResponse } from '../types/api.types.ts';

export async function listTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const teams = await teamService.getTeams(tournamentId);
    const response: ApiResponse = {
      success: true,
      data: teams,
      meta: {
        total: teams.length,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, teamId } = req.params;
    const team = await teamService.getTeamById(tournamentId, teamId);
    const response: ApiResponse = {
      success: true,
      data: team,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const team = await teamService.createTeam(tournamentId, req.body);
    const response: ApiResponse = {
      success: true,
      data: team,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, teamId } = req.params;
    const team = await teamService.updateTeam(tournamentId, teamId, req.body);
    const response: ApiResponse = {
      success: true,
      data: team,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, teamId } = req.params;
    await teamService.deleteTeam(tournamentId, teamId);
    const response: ApiResponse = {
      success: true,
      data: { message: `Team "${teamId}" deleted successfully` },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}
