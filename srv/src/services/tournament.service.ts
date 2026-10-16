import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { Tournament } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class TournamentService {
  async getAllTournaments(): Promise<Tournament[]> {
    return tournamentRepository.findAll();
  }

  async getTournamentById(id: string): Promise<Tournament> {
    const tournament = await tournamentRepository.findById(id);
    if (!tournament) {
      throw AppError.notFound(`Tournament with ID "${id}" was not found`);
    }
    return tournament;
  }

  async createTournament(payload: {
    id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    knockout_starting_round?: 'qf' | 'sf' | 'final';
    is_user_portal_enabled?: boolean;
  }): Promise<Tournament> {
    const existing = await tournamentRepository.findById(payload.id);
    if (existing) {
      throw AppError.conflict(`Tournament with ID "${payload.id}" already exists`);
    }

    const newTournament: Partial<Tournament> = {
      ...payload,
      status: 'ACTIVE',
      is_bracket_locked: false,
      is_knockout_created: false,
      bracket_data: {},
    };

    return tournamentRepository.create(newTournament);
  }

  async updateTournament(id: string, payload: Partial<Tournament>): Promise<Tournament> {
    await this.getTournamentById(id); // Ensure exists
    return tournamentRepository.update(id, payload);
  }

  async deleteTournament(id: string): Promise<void> {
    if (id === 'sci_cup_main') {
      throw AppError.badRequest('Cannot delete primary tournament "sci_cup_main"');
    }
    await this.getTournamentById(id); // Ensure exists
    try {
      const { deleteTournamentCascade } = await import('../repositories/transaction.helper.ts');
      await deleteTournamentCascade(id);
    } catch (err) {
      console.warn('[deleteTournament] Cascade cleanup notice:', err);
    }
    await tournamentRepository.delete(id);
  }

  async getGroups(id: string): Promise<Record<string, any[]>> {
    await this.getTournamentById(id);
    const { teamRepository } = await import('../repositories/team.repository.ts');
    const teams = await teamRepository.findByTournament(id);

    const groups: Record<string, any[]> = {};
    for (const team of teams) {
      const g = team.group_name || 'Ungrouped';
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    }
    return groups;
  }

  async getBracket(id: string): Promise<any> {
    const tourney = await this.getTournamentById(id);
    return {
      knockout_starting_round: tourney.knockout_starting_round || 'sf',
      is_bracket_locked: Boolean(tourney.is_bracket_locked),
      is_knockout_created: Boolean(tourney.is_knockout_created),
      bracket_data: tourney.bracket_data || {},
    };
  }

  async updateBracket(id: string, payload: { bracket_data?: any; is_bracket_locked?: boolean; is_knockout_created?: boolean }): Promise<any> {
    await this.getTournamentById(id);
    return tournamentRepository.update(id, payload);
  }
}

export const tournamentService = new TournamentService();
