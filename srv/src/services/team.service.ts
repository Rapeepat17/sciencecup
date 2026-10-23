import { teamRepository } from '../repositories/team.repository.ts';
import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { Team } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { imageService } from './image.service.ts';

export class TeamService {
  async getTeams(tournamentId: string): Promise<Team[]> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }
    try {
      const teams = await teamRepository.findByTournament(tournamentId);
      return teams;
    } catch (err: any) {
      if (err.code !== '42703' && !err.message?.includes('tournament_id')) {
        throw err;
      }
    }

    // Pre-migration schema fallback: extract teams from tournament.bracket_data?.groups
    const bracketData: any = tournament.bracket_data || {};
    const groups = bracketData.groups || {};
    const extracted: Team[] = [];
    for (const groupName of Object.keys(groups)) {
      const list = groups[groupName] || [];
      for (const t of list) {
        extracted.push({
          id: String(t.id),
          tournament_id: tournamentId,
          name: t.name,
          short_name: t.shortName || t.name.slice(0, 3).toUpperCase(),
          group_name: groupName,
          logo: t.logo || '',
        } as Team);
      }
    }
    return extracted;
  }

  async getTeamById(tournamentId: string, teamId: string): Promise<Team> {
    const team = await teamRepository.findById(tournamentId, teamId);
    if (!team) {
      const anyTeam = await teamRepository.findAnywhere(teamId);
      if (anyTeam && anyTeam.tournament_id !== tournamentId) {
        throw AppError.badRequest(
          `Team "${teamId}" belongs to another tournament ("${anyTeam.tournament_id}"), cross-tournament access is denied`,
          'CROSS_TOURNAMENT_MISMATCH'
        );
      }
      throw AppError.notFound(`Team "${teamId}" not found in tournament "${tournamentId}"`);
    }
    return team;
  }

  async createTeam(
    tournamentId: string,
    payload: { id?: string; name: string; short_name?: string | null; manager?: string | null; group_name?: string | null; logo?: string | null }
  ): Promise<Team> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    const teamId = payload.id?.trim();
    if (teamId) {
      const existing = await teamRepository.findById(tournamentId, teamId);
      if (existing) {
        throw AppError.conflict(`Team with ID "${teamId}" already exists in this tournament`);
      }
    }

    let finalLogo = payload.logo || undefined;
    let finalLogoPath: string | undefined = undefined;

    if (finalLogo && finalLogo.startsWith('data:image/')) {
      try {
        const decoded = imageService.decodeAndValidateBase64(finalLogo);
        const storagePath = imageService.buildStoragePath(
          tournamentId,
          'teams',
          teamId || 'new_team',
          decoded.extension
        );
        const uploadResult = await imageService.uploadToStorage(
          storagePath,
          decoded.buffer,
          decoded.contentType,
          finalLogo
        );
        finalLogo = uploadResult.url;
        finalLogoPath = uploadResult.path;
      } catch (uploadErr) {
        console.warn('[TeamService] Logo upload failed, using fallback:', uploadErr);
      }
    }

    const createData: any = {
      ...payload,
      logo: finalLogo || null,
      logo_path: finalLogoPath || null,
      tournament_id: tournamentId,
    };
    if (teamId) {
      createData.id = teamId;
    }

    return teamRepository.create(createData);
  }

  async updateTeam(tournamentId: string, teamId: string, payload: Partial<Team>): Promise<Team> {
    await this.getTeamById(tournamentId, teamId);
    const updateData = { ...payload };

    if (updateData.logo && updateData.logo.startsWith('data:image/')) {
      try {
        const decoded = imageService.decodeAndValidateBase64(updateData.logo);
        const storagePath = imageService.buildStoragePath(
          tournamentId,
          'teams',
          teamId,
          decoded.extension
        );
        const uploadResult = await imageService.uploadToStorage(
          storagePath,
          decoded.buffer,
          decoded.contentType,
          updateData.logo
        );
        updateData.logo = uploadResult.url;
        updateData.logo_path = uploadResult.path;
      } catch (uploadErr) {
        console.warn('[TeamService] Logo update upload failed, using fallback:', uploadErr);
      }
    }

    return teamRepository.update(tournamentId, teamId, updateData);
  }

  async deleteTeam(tournamentId: string, teamId: string): Promise<void> {
    await this.getTeamById(tournamentId, teamId);
    await teamRepository.delete(tournamentId, teamId);
  }
}

export const teamService = new TeamService();
