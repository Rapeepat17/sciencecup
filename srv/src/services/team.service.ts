import { teamRepository } from '../repositories/team.repository.ts';
import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { Team } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class TeamService {
  async getTeams(tournamentId: string): Promise<Team[]> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }
    try {
      const teams = await teamRepository.findByTournament(tournamentId);
      if (teams && teams.length > 0) return teams;
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
          name_en: t.nameEn || t.name,
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

  async createTeam(tournamentId: string, payload: { id: string; name: string; group_name: string; logo?: string | null }): Promise<Team> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    const existing = await teamRepository.findById(tournamentId, payload.id);
    if (existing) {
      throw AppError.conflict(`Team with ID "${payload.id}" already exists in this tournament`);
    }

    return teamRepository.create({
      ...payload,
      tournament_id: tournamentId,
    });
  }

  async updateTeam(tournamentId: string, teamId: string, payload: Partial<Team>): Promise<Team> {
    await this.getTeamById(tournamentId, teamId);
    return teamRepository.update(tournamentId, teamId, payload);
  }

  async deleteTeam(tournamentId: string, teamId: string): Promise<void> {
    await this.getTeamById(tournamentId, teamId);
    await teamRepository.delete(tournamentId, teamId);
  }
}

export const teamService = new TeamService();
