import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { Tournament } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { imageService } from './image.service.ts';

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
    id?: string;
    name: string;
    description?: string;
    logo?: string;
    start_date?: string;
    end_date?: string;
    knockout_starting_round?: 'qf' | 'sf' | 'final';
    is_user_portal_enabled?: boolean;
  }): Promise<Tournament> {
    const tournamentId = payload.id?.trim();
    if (tournamentId) {
      const existing = await tournamentRepository.findById(tournamentId);
      if (existing) {
        throw AppError.conflict(`Tournament with ID "${tournamentId}" already exists`);
      }
    }

    let finalLogo = payload.logo || undefined;
    if (finalLogo && finalLogo.startsWith('data:image/')) {
      try {
        const decoded = imageService.decodeAndValidateBase64(finalLogo);
        const storagePath = imageService.buildStoragePath(
          tournamentId || 'new_tournament',
          'tournaments',
          'logo',
          decoded.extension
        );
        const uploadResult = await imageService.uploadToStorage(
          storagePath,
          decoded.buffer,
          decoded.contentType,
          finalLogo
        );
        finalLogo = uploadResult.url;
      } catch (uploadErr) {
        console.warn('[TournamentService] Logo upload to storage failed, using fallback:', uploadErr);
      }
    }

    const newTournament: Partial<Tournament> = {
      ...payload,
      logo: finalLogo,
      is_bracket_locked: false,
      is_knockout_created: false,
      bracket_data: {},
    };
    if (tournamentId) {
      newTournament.id = tournamentId;
    }

    return tournamentRepository.create(newTournament);
  }

  async updateTournament(id: string, payload: Partial<Tournament>): Promise<Tournament> {
    await this.getTournamentById(id); // Ensure exists

    const updateData = { ...payload };
    if (updateData.logo && updateData.logo.startsWith('data:image/')) {
      try {
        const decoded = imageService.decodeAndValidateBase64(updateData.logo);
        const storagePath = imageService.buildStoragePath(
          id,
          'tournaments',
          'logo',
          decoded.extension
        );
        const uploadResult = await imageService.uploadToStorage(
          storagePath,
          decoded.buffer,
          decoded.contentType,
          updateData.logo
        );
        updateData.logo = uploadResult.url;
      } catch (uploadErr) {
        console.warn('[TournamentService] Logo update to storage failed, using fallback:', uploadErr);
      }
    }

    return tournamentRepository.update(id, updateData);
  }

  async deleteTournament(id: string): Promise<void> {
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
