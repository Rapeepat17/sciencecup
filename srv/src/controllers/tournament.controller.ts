import { Request, Response, NextFunction } from 'express';
import { tournamentService } from '../services/tournament.service.ts';
import { matchService } from '../services/match.service.ts';
import { ApiResponse } from '../types/api.types.ts';

export async function listTournaments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournaments = await tournamentService.getAllTournaments();
    const response: ApiResponse = {
      success: true,
      data: tournaments,
      meta: {
        total: tournaments.length,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const tournament = await tournamentService.getTournamentById(tournamentId);
    const response: ApiResponse = {
      success: true,
      data: tournament,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const created = await tournamentService.createTournament(req.body);
    const response: ApiResponse = {
      success: true,
      data: created,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const updated = await tournamentService.updateTournament(tournamentId, req.body);
    const response: ApiResponse = {
      success: true,
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    await tournamentService.deleteTournament(tournamentId);
    const response: ApiResponse = {
      success: true,
      data: { message: `Tournament "${tournamentId}" deleted successfully` },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const groups = await tournamentService.getGroups(tournamentId);
    const response: ApiResponse = {
      success: true,
      data: groups,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getBracket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const bracket = await tournamentService.getBracket(tournamentId);
    const response: ApiResponse = {
      success: true,
      data: bracket,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateBracket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const updated = await tournamentService.updateBracket(tournamentId, req.body);
    const response: ApiResponse = {
      success: true,
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getStandings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const standings = await matchService.getGroupStandings(tournamentId);
    const response: ApiResponse = {
      success: true,
      data: standings,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}


