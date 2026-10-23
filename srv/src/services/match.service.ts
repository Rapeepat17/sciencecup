import { matchRepository } from '../repositories/match.repository.ts';
import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { teamRepository } from '../repositories/team.repository.ts';
import { standingsService } from './standings.service.ts';
import { teamService } from './team.service.ts';
import { Match, MatchEvent } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class MatchService {
  async getMatches(tournamentId: string, stage?: string): Promise<Match[]> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }
    try {
      const matches = await matchRepository.findByTournament(tournamentId, stage);
      return matches;
    } catch (err: any) {
      if (err.code !== '42703' && !err.message?.includes('tournament_id')) {
        throw err;
      }
    }

    // Pre-migration schema fallback: extract matches from tournament.bracket_data
    const bracketData: any = tournament.bracket_data || {};
    const matchesList: any[] = [];
    if (stage === 'knockout' || !stage) {
      if (Array.isArray(bracketData.r16Matches)) matchesList.push(...bracketData.r16Matches);
      if (Array.isArray(bracketData.qfMatches)) matchesList.push(...bracketData.qfMatches);
      if (Array.isArray(bracketData.sfMatches)) matchesList.push(...bracketData.sfMatches);
      if (bracketData.finalMatch) matchesList.push(bracketData.finalMatch);
    }
    return matchesList as Match[];
  }

  async getMatchById(tournamentId: string, matchId: string): Promise<Match & { events: MatchEvent[] }> {
    const match = await matchRepository.findById(tournamentId, matchId);
    if (!match) {
      const anyMatch = await matchRepository.findAnywhere(matchId);
      if (anyMatch && anyMatch.tournament_id !== tournamentId) {
        throw AppError.badRequest(
          `Match "${matchId}" belongs to another tournament ("${anyMatch.tournament_id}"), cross-tournament access is denied`,
          'CROSS_TOURNAMENT_MISMATCH'
        );
      }
      throw AppError.notFound(`Match "${matchId}" not found in tournament "${tournamentId}"`);
    }

    const events = await matchRepository.getEventsByMatch(tournamentId, matchId);
    return { ...match, events };
  }

  async getMatchEvents(tournamentId: string, matchId: string): Promise<MatchEvent[]> {
    await this.getMatchById(tournamentId, matchId); // Ensure exists & belongs to tournament
    return matchRepository.getEventsByMatch(tournamentId, matchId);
  }

  async createMatch(
    tournamentId: string,
    payload: {
      id?: string;
      stage: 'group' | 'qf' | 'sf' | 'final';
      group_name?: string | null;
      home_team_id: string;
      away_team_id: string;
      match_date?: string | null;
      match_time?: string | null;
      pitch?: string | null;
    }
  ): Promise<Match> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    // Cross-tournament validation: ensure both teams belong to this tournament
    const homeTeam = await teamRepository.findById(tournamentId, payload.home_team_id);
    if (!homeTeam) {
      throw AppError.badRequest(
        `Home team "${payload.home_team_id}" does not belong to tournament "${tournamentId}"`,
        'CROSS_TOURNAMENT_MISMATCH'
      );
    }

    const awayTeam = await teamRepository.findById(tournamentId, payload.away_team_id);
    if (!awayTeam) {
      throw AppError.badRequest(
        `Away team "${payload.away_team_id}" does not belong to tournament "${tournamentId}"`,
        'CROSS_TOURNAMENT_MISMATCH'
      );
    }

    const createData: any = {
      ...payload,
      tournament_id: tournamentId,
      status: 'SCHEDULED',
      home_score: null,
      away_score: null,
    };
    if (payload.id?.trim()) {
      createData.id = payload.id.trim();
    }

    return matchRepository.create(createData);
  }

  async updateMatchScore(
    tournamentId: string,
    matchId: string,
    payload: {
      home_score?: number | null;
      away_score?: number | null;
      home_penalty_score?: number | null;
      away_penalty_score?: number | null;
      status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'POSTPONED';
      match_date?: string | null;
      match_time?: string | null;
      pitch?: string | null;
    }
  ): Promise<Match> {
    const existing = await matchRepository.findById(tournamentId, matchId);
    if (!existing) {
      throw AppError.notFound(`Match "${matchId}" not found in tournament "${tournamentId}"`);
    }

    // Determine status automatically if scores provided and status not explicitly given
    let status = payload.status || existing.status;
    if (!payload.status && payload.home_score !== undefined && payload.home_score !== null && payload.away_score !== undefined && payload.away_score !== null) {
      status = 'COMPLETED';
    }

    return matchRepository.update(tournamentId, matchId, {
      ...payload,
      status,
    });
  }

  async addMatchEvent(
    tournamentId: string,
    matchId: string,
    event: {
      team_id?: string | null;
      player_id?: string | null;
      player_number?: string | null;
      event_type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'penalty';
      minute: number;
      extra_minute?: number;
      detail?: string | null;
    }
  ): Promise<MatchEvent> {
    const match = await matchRepository.findById(tournamentId, matchId);
    if (!match) {
      throw AppError.notFound(`Match "${matchId}" not found in tournament "${tournamentId}"`);
    }

    return matchRepository.addEvent({
      ...event,
      tournament_id: tournamentId,
      match_id: matchId,
    });
  }

  async getGroupStandings(tournamentId: string) {
    const teams = await teamService.getTeams(tournamentId);
    const matches = await this.getMatches(tournamentId, 'group');
    return standingsService.calculateGroupStandings(teams, matches);
  }
}

export const matchService = new MatchService();
