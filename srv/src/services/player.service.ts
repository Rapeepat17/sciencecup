import { playerRepository } from '../repositories/player.repository.ts';
import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { teamRepository } from '../repositories/team.repository.ts';
import { Player } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class PlayerService {
  async getPlayers(tournamentId: string, teamId?: string): Promise<Player[]> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    if (teamId) {
      const team = await teamRepository.findById(tournamentId, teamId);
      if (!team) {
        throw AppError.notFound(`Team "${teamId}" does not belong to tournament "${tournamentId}"`);
      }
    }

    return playerRepository.findByTournament(tournamentId, teamId);
  }

  async getPlayerById(tournamentId: string, playerId: string): Promise<Player> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    const player = await playerRepository.findById(tournamentId, playerId);
    if (!player) {
      throw AppError.notFound(`Player "${playerId}" not found in tournament "${tournamentId}"`);
    }

    return player;
  }

  async createPlayer(
    tournamentId: string,
    payload: { id?: string; team_id: string; name: string; number?: string | null; position?: string | null }
  ): Promise<Player> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    // Strict cross-tournament guard: ensure target team belongs to this tournament
    const team = await teamRepository.findById(tournamentId, payload.team_id);
    if (!team) {
      throw AppError.badRequest(
        `Team "${payload.team_id}" does not exist or does not belong to tournament "${tournamentId}"`,
        'CROSS_TOURNAMENT_MISMATCH'
      );
    }

    const playerId = payload.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return playerRepository.create({
      ...payload,
      id: playerId,
      tournament_id: tournamentId,
    });
  }

  async updatePlayer(
    tournamentId: string,
    playerId: string,
    payload: { name?: string; number?: string | null; position?: string | null }
  ): Promise<Player> {
    await this.getPlayerById(tournamentId, playerId);
    return playerRepository.update(tournamentId, playerId, payload);
  }

  async deletePlayer(tournamentId: string, playerId: string): Promise<void> {
    await this.getPlayerById(tournamentId, playerId);
    await playerRepository.delete(tournamentId, playerId);
  }
}

export const playerService = new PlayerService();
