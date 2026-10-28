import { Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service.ts';
import { ApiResponse } from '../types/api.types.ts';

export async function listMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const stage = req.query.stage as string | undefined;
    const matches = await matchService.getMatches(tournamentId, stage);
    const response: ApiResponse = {
      success: true,
      data: matches,
      meta: {
        total: matches.length,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, matchId } = req.params;
    const match = await matchService.getMatchById(tournamentId, matchId);
    const response: ApiResponse = {
      success: true,
      data: match,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function syncMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const matches = await matchService.syncMatches(tournamentId, req.body.matches || []);
    const response: ApiResponse = {
      success: true,
      data: matches,
      meta: {
        total: matches.length,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId } = req.params;
    const match = await matchService.createMatch(tournamentId, req.body);
    const response: ApiResponse = {
      success: true,
      data: match,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateMatchScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, matchId } = req.params;
    const updated = await matchService.updateMatchScore(tournamentId, matchId, req.body);
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

export async function getMatchEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, matchId } = req.params;
    const events = await matchService.getMatchEvents(tournamentId, matchId);
    const response: ApiResponse = {
      success: true,
      data: events,
      meta: {
        total: events.length,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function addMatchEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournamentId, matchId } = req.params;
    const event = await matchService.addMatchEvent(tournamentId, matchId, req.body);
    const response: ApiResponse = {
      success: true,
      data: event,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(201).json(response);
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
