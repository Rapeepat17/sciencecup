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

  async getGroups(id: string): Promise<{ groups: any[]; teamsByGroup: Record<string, any[]> }> {
    await this.getTournamentById(id);
    const { groupRepository } = await import('../repositories/group.repository.ts');
    const { teamRepository } = await import('../repositories/team.repository.ts');

    const [groupRecords, teams] = await Promise.all([
      groupRepository.findByTournament(id),
      teamRepository.findByTournament(id),
    ]);

    const teamsByGroup: Record<string, any[]> = {};
    for (const team of teams) {
      const g = team.group_name || 'Ungrouped';
      if (!teamsByGroup[g]) teamsByGroup[g] = [];
      teamsByGroup[g].push(team);
    }

    return {
      groups: groupRecords,
      teamsByGroup,
    };
  }

  async createGroup(id: string, name: string): Promise<any> {
    await this.getTournamentById(id);
    const { groupRepository } = await import('../repositories/group.repository.ts');
    return groupRepository.create(id, name);
  }

  async deleteGroup(id: string, groupId: number | string, groupName?: string): Promise<any> {
    await this.getTournamentById(id);
    const { groupRepository } = await import('../repositories/group.repository.ts');
    const { teamRepository } = await import('../repositories/team.repository.ts');

    // 1. Delete group record
    await groupRepository.delete(id, groupId);

    // 2. Unassign teams belonging to this group name if provided
    if (groupName) {
      const teams = await teamRepository.findByTournament(id);
      const toUnassign = teams.filter(t => t.group_name === groupName);
      await Promise.all(
        toUnassign.map(t => teamRepository.update(id, t.id, { group_name: null }))
      );
    }
    return { success: true };
  }

  async renameGroup(id: string, groupId: number | string, oldName: string, newName: string): Promise<any> {
    await this.getTournamentById(id);
    const { groupRepository } = await import('../repositories/group.repository.ts');
    const { teamRepository } = await import('../repositories/team.repository.ts');

    // 1. Update group record
    const updated = await groupRepository.update(id, groupId, newName);

    // 2. Update teams belonging to this group
    const teams = await teamRepository.findByTournament(id);
    const toUpdate = teams.filter(t => t.group_name === oldName);
    await Promise.all(
      toUpdate.map(t => teamRepository.update(id, t.id, { group_name: newName }))
    );
    return updated;
  }

  async updateGroups(
    id: string,
    payload: {
      groups?: string[];
      assignments?: Array<{ teamId: string | number; groupName: string | null }>;
    }
  ): Promise<any> {
    await this.getTournamentById(id);
    const { groupRepository } = await import('../repositories/group.repository.ts');
    const { teamRepository } = await import('../repositories/team.repository.ts');

    // 1. Sync group records in database if groups list provided
    let syncedGroups: any[] = [];
    if (payload.groups) {
      syncedGroups = await groupRepository.syncGroups(id, payload.groups);
    }

    // 2. Batch update team group names if assignments provided
    let updatedTeams: any[] = [];
    if (payload.assignments && payload.assignments.length > 0) {
      updatedTeams = await Promise.all(
        payload.assignments.map(a =>
          teamRepository.update(id, String(a.teamId), {
            group_name: a.groupName || null,
          })
        )
      );
    }

    return {
      groups: syncedGroups,
      teams: updatedTeams,
    };
  }

  private buildDefaultBracketData(existing?: Record<string, any>): Record<string, any> {
    const emptyTeam = () => ({
      id: null,
      name: '-',
      seedCode: null,
      shortName: '',
      logo: '',
      score: null,
      penaltyScore: null,
    });

    const defaultQF = [
      {
        id: 'qf1',
        matchId: null,
        matchNumber: 1,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 1)',
        seed1Label: 'A1',
        seed2Label: 'B2',
        date: 'TBD',
        time: '16:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'qf2',
        matchId: null,
        matchNumber: 2,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 2)',
        seed1Label: 'B1',
        seed2Label: 'A2',
        date: 'TBD',
        time: '17:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'qf3',
        matchId: null,
        matchNumber: 3,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 3)',
        seed1Label: 'C1',
        seed2Label: 'D2',
        date: 'TBD',
        time: '18:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'qf4',
        matchId: null,
        matchNumber: 4,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 4)',
        seed1Label: 'D1',
        seed2Label: 'C2',
        date: 'TBD',
        time: '19:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
    ];

    const defaultSF = [
      {
        id: 'sf1',
        matchId: null,
        matchNumber: 5,
        roundName: 'รอบรองชนะเลิศ',
        slotLabel: 'รอบรองชนะเลิศ (คู่ที่ 1)',
        seed1Label: 'A1',
        seed2Label: 'B2',
        date: 'TBD',
        time: '16:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'sf2',
        matchId: null,
        matchNumber: 6,
        roundName: 'รอบรองชนะเลิศ',
        slotLabel: 'รอบรองชนะเลิศ (คู่ที่ 2)',
        seed1Label: 'B1',
        seed2Label: 'A2',
        date: 'TBD',
        time: '17:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
    ];

    const defaultThirdPlace = {
      id: 'third_place',
      matchId: null,
      matchNumber: 7,
      roundName: 'นัดชิงอันดับ 3',
      slotLabel: 'นัดชิงอันดับ 3',
      seed1Label: 'ผู้แพ้ รอบรองฯ 1',
      seed2Label: 'ผู้แพ้ รอบรองฯ 2',
      date: 'TBD',
      time: '16:00',
      venue: 'สนาม 1',
      team1: emptyTeam(),
      team2: emptyTeam(),
      winner: null,
    };

    const defaultFinal = {
      id: 'final',
      matchId: null,
      matchNumber: 8,
      roundName: 'นัดชิงชนะเลิศ',
      slotLabel: 'นัดชิงชนะเลิศ (Final)',
      seed1Label: 'ผู้ชนะ รอบรองฯ 1',
      seed2Label: 'ผู้ชนะ รอบรองฯ 2',
      date: 'TBD',
      time: '18:00',
      venue: 'สนาม 1',
      team1: emptyTeam(),
      team2: emptyTeam(),
      winner: null,
    };

    const mergeSlot = (def: any, incoming?: any) => {
      if (!incoming || typeof incoming !== 'object') return def;
      const cleanDate =
        incoming.date === '2 พ.ย. 2026' ? 'TBD' : incoming.date || def.date;
      const cleanVenue =
        incoming.venue === 'สนามหลัก (รอบชิง)' || incoming.venue === 'สนามหลัก'
          ? def.venue
          : incoming.venue || def.venue;
      return {
        ...def,
        ...incoming,
        date: cleanDate,
        venue: cleanVenue,
        roundName: def.roundName,
        slotLabel: incoming.slotLabel || def.slotLabel,
        team1: { ...def.team1, ...(incoming.team1 || {}) },
        team2: { ...def.team2, ...(incoming.team2 || {}) },
      };
    };

    return {
      qfMatches: defaultQF.map((def, idx) =>
        mergeSlot(def, existing?.qfMatches?.[idx])
      ),
      sfMatches: defaultSF.map((def, idx) =>
        mergeSlot(def, existing?.sfMatches?.[idx])
      ),
      thirdPlaceMatch: mergeSlot(defaultThirdPlace, existing?.thirdPlaceMatch),
      finalMatch: mergeSlot(defaultFinal, existing?.finalMatch),
    };
  }

  private assignBracketMatchNumbers(
    bracketData: Record<string, any>,
    startingRound: string,
    baseMatchNumber: number
  ): void {
    if (startingRound === 'qf') {
      bracketData.qfMatches.forEach((m: any, idx: number) => {
        m.matchNumber = baseMatchNumber + 1 + idx;
      });
      bracketData.sfMatches.forEach((m: any, idx: number) => {
        m.matchNumber = baseMatchNumber + 5 + idx;
      });
      bracketData.thirdPlaceMatch.matchNumber = baseMatchNumber + 7;
      bracketData.finalMatch.matchNumber = baseMatchNumber + 8;
    } else if (startingRound === 'sf') {
      bracketData.sfMatches.forEach((m: any, idx: number) => {
        m.matchNumber = baseMatchNumber + 1 + idx;
      });
      bracketData.thirdPlaceMatch.matchNumber = baseMatchNumber + 3;
      bracketData.finalMatch.matchNumber = baseMatchNumber + 4;
    } else {
      bracketData.finalMatch.matchNumber = baseMatchNumber + 1;
    }
  }

  private buildGroupSeeds(
    groups: Array<{ name: string }>,
    teams: Array<{ group_name?: string | null }>
  ): Array<{ groupName: string; seeds: string[] }> {
    const cleanGroupLetter = (raw: string) =>
      raw
        .replace(/^(กลุ่ม|สาย|Group)\s*/i, '')
        .trim()
        .toUpperCase();

    const teamCountByLetter = new Map<string, number>();
    for (const t of teams) {
      if (t.group_name) {
        const letter = cleanGroupLetter(t.group_name);
        if (letter) {
          teamCountByLetter.set(letter, (teamCountByLetter.get(letter) || 0) + 1);
        }
      }
    }

    const lettersSet = new Set<string>();
    for (const g of groups) {
      if (g.name) {
        const letter = cleanGroupLetter(g.name);
        if (letter) lettersSet.add(letter);
      }
    }
    for (const letter of teamCountByLetter.keys()) {
      lettersSet.add(letter);
    }

    const letters =
      lettersSet.size > 0
        ? Array.from(lettersSet).sort((a, b) => a.localeCompare(b))
        : ['A', 'B', 'C', 'D'];

    return letters.map((letter) => {
      const count = Math.max(4, teamCountByLetter.get(letter) || 4);
      const seeds: string[] = [];
      for (let rank = 1; rank <= count; rank++) {
        seeds.push(`${letter}${rank}`);
      }
      return {
        groupName: letter,
        seeds,
      };
    });
  }

  private isPlaceholderSlotName(name?: string | null): boolean {
    if (!name) return true;
    const trimmed = String(name).trim();
    if (!trimmed || trimmed === '-' || trimmed === 'TBD') return true;
    if (/^(คู่ชนะ|คู่แพ้|ผู้ชนะ|ผู้แพ้|ทีมชนะ|ทีมแพ้)\s*\d+/i.test(trimmed)) {
      return true;
    }
    return false;
  }

  private hasFeederMatchConfigured(slot: any): boolean {
    if (!slot) return false;
    const n1 = String(slot.team1?.name || '').trim();
    const n2 = String(slot.team2?.name || '').trim();
    return Boolean((n1 && n1 !== '-') || (n2 && n2 !== '-'));
  }

  private resolveSlotWinnerSide(slot: any): 1 | 2 | null {
    if (!slot) return null;
    const t1Valid = !this.isPlaceholderSlotName(slot.team1?.name);
    const t2Valid = !this.isPlaceholderSlotName(slot.team2?.name);

    const s1 = slot.team1?.score;
    const s2 = slot.team2?.score;
    const p1 = slot.team1?.penaltyScore;
    const p2 = slot.team2?.penaltyScore;

    if (
      t1Valid &&
      t2Valid &&
      typeof s1 === 'number' &&
      typeof s2 === 'number' &&
      (slot.status === 'FINISHED' ||
        slot.status === 'COMPLETED' ||
        slot.status === 'FT' ||
        slot.winner === 1 ||
        slot.winner === 2)
    ) {
      if (s1 > s2) return 1;
      if (s2 > s1) return 2;
      if (typeof p1 === 'number' && typeof p2 === 'number' && p1 !== p2) {
        return p1 > p2 ? 1 : 2;
      }
    }

    if (slot.winner === 1 && t1Valid) return 1;
    if (slot.winner === 2 && t2Valid) return 2;
    return null;
  }

  private advanceBracketWinners(
    bracketData: Record<string, any>,
    startingRound: string,
    baseMatchNumber = 0
  ): Record<string, any> {
    const next = this.buildDefaultBracketData(bracketData);
    this.assignBracketMatchNumbers(next, startingRound, baseMatchNumber);

    const makePlaceholderTeam = (label: string) => ({
      id: null,
      name: label,
      seedCode: null,
      shortName: '',
      logo: '',
      score: null,
      penaltyScore: null,
    });

    const makeEmptyTeam = () => makePlaceholderTeam('-');

    const getWinnerOrPlaceholder = (feederSlot: any) => {
      const winnerSide = this.resolveSlotWinnerSide(feederSlot);
      if (winnerSide === 1) {
        return {
          ...feederSlot.team1,
          score: null,
          penaltyScore: null,
        };
      }
      if (winnerSide === 2) {
        return {
          ...feederSlot.team2,
          score: null,
          penaltyScore: null,
        };
      }
      if (this.hasFeederMatchConfigured(feederSlot)) {
        return makePlaceholderTeam(`คู่ชนะ ${feederSlot.matchNumber}`);
      }
      return makeEmptyTeam();
    };

    const getLoserOrPlaceholder = (feederSlot: any) => {
      const winnerSide = this.resolveSlotWinnerSide(feederSlot);
      if (winnerSide === 1 && !this.isPlaceholderSlotName(feederSlot.team2?.name)) {
        return {
          ...feederSlot.team2,
          score: null,
          penaltyScore: null,
        };
      }
      if (winnerSide === 2 && !this.isPlaceholderSlotName(feederSlot.team1?.name)) {
        return {
          ...feederSlot.team1,
          score: null,
          penaltyScore: null,
        };
      }
      if (this.hasFeederMatchConfigured(feederSlot)) {
        return makePlaceholderTeam(`คู่แพ้ ${feederSlot.matchNumber}`);
      }
      return makeEmptyTeam();
    };

    // 1. Advance QF -> SF (Only when startingRound === 'qf')
    if (
      startingRound === 'qf' &&
      Array.isArray(next.qfMatches) &&
      next.qfMatches.length === 4
    ) {
      next.sfMatches[0].team1 = getWinnerOrPlaceholder(next.qfMatches[0]);
      next.sfMatches[0].team2 = getWinnerOrPlaceholder(next.qfMatches[1]);
      next.sfMatches[1].team1 = getWinnerOrPlaceholder(next.qfMatches[2]);
      next.sfMatches[1].team2 = getWinnerOrPlaceholder(next.qfMatches[3]);
    }

    // 2. Advance SF -> Final & Third Place (When startingRound === 'qf' or 'sf')
    if (
      (startingRound === 'qf' || startingRound === 'sf') &&
      Array.isArray(next.sfMatches) &&
      next.sfMatches.length === 2
    ) {
      next.finalMatch.team1 = getWinnerOrPlaceholder(next.sfMatches[0]);
      next.finalMatch.team2 = getWinnerOrPlaceholder(next.sfMatches[1]);
      next.thirdPlaceMatch.team1 = getLoserOrPlaceholder(next.sfMatches[0]);
      next.thirdPlaceMatch.team2 = getLoserOrPlaceholder(next.sfMatches[1]);
    }

    return next;
  }

  async getBracket(id: string): Promise<any> {
    const tourney = await this.getTournamentById(id);
    const { teamRepository } = await import('../repositories/team.repository.ts');
    const { matchRepository } = await import('../repositories/match.repository.ts');
    const { groupRepository } = await import('../repositories/group.repository.ts');

    const [teams, allMatches, groups] = await Promise.all([
      teamRepository.findByTournament(id),
      matchRepository.findByTournament(id),
      groupRepository.findByTournament(id),
    ]);

    const teamById = new Map<string, any>();
    const teamByName = new Map<string, any>();
    for (const t of teams) {
      teamById.set(String(t.id), t);
      if (t.name) teamByName.set(t.name.trim().toLowerCase(), t);
    }

    const startingRound = tourney.knockout_starting_round || 'sf';
    const bracketData = this.buildDefaultBracketData(tourney.bracket_data || {});

    const groupMatches = allMatches.filter((m) => !m.stage || m.stage === 'group');
    const knockoutMatches = allMatches.filter((m) => m.stage && m.stage !== 'group');

    const maxGroupMatchNum = groupMatches.reduce(
      (max, m) => Math.max(max, Number(m.match_number) || 0),
      0
    );
    const baseMatchNumber =
      maxGroupMatchNum > 0 ? maxGroupMatchNum : groupMatches.length;

    this.assignBracketMatchNumbers(bracketData, startingRound, baseMatchNumber);

    const enrichTeamSlot = (slotTeam: any) => {
      if (!slotTeam) {
        return {
          id: null,
          name: '-',
          seedCode: null,
          shortName: '',
          logo: '',
          score: null,
        };
      }
      const matched =
        (slotTeam.id && teamById.get(String(slotTeam.id))) ||
        (slotTeam.name &&
          slotTeam.name !== '-' &&
          teamByName.get(String(slotTeam.name).trim().toLowerCase()));

      if (matched) {
        return {
          ...slotTeam,
          id: String(matched.id),
          name: matched.name,
          shortName: matched.short_name || matched.name.slice(0, 3).toUpperCase(),
          logo: (matched as any).logo_url || matched.logo || '',
        };
      }
      return slotTeam;
    };

    const enrichMatchup = (m: any) => {
      const t1 = enrichTeamSlot(m.team1);
      const t2 = enrichTeamSlot(m.team2);

      // Sync latest date/time/venue/score if a matching knockout match exists in public.matches
      const dbMatch = knockoutMatches.find(
        (km) =>
          (m.matchId && String(km.id) === String(m.matchId)) ||
          (Number(km.match_number) === Number(m.matchNumber) &&
            km.round_name === m.roundName) ||
          (km.round_name === m.roundName &&
            t1.id &&
            t2.id &&
            String(km.home_team_id) === String(t1.id) &&
            String(km.away_team_id) === String(t2.id))
      );

      const dbStatus = String(dbMatch?.status || '').toUpperCase();
      const hasPlayedScore = ['LIVE', 'FINISHED', 'COMPLETED', 'FT'].includes(dbStatus);

      return {
        ...m,
        matchId: dbMatch ? String(dbMatch.id) : m.matchId || null,
        matchNumber: dbMatch?.match_number
          ? Number(dbMatch.match_number)
          : m.matchNumber,
        status: dbStatus || m.status || 'SCHEDULED',
        date: dbMatch?.match_date || m.date || 'TBD',
        time: dbMatch?.match_time || m.time || '16:00',
        venue: dbMatch?.venue || m.venue || 'สนามหลัก',
        team1: {
          ...t1,
          score: hasPlayedScore ? (dbMatch?.home_score ?? t1.score ?? null) : (t1.score ?? null),
          penaltyScore: hasPlayedScore
            ? (dbMatch?.home_penalty_score ?? t1.penaltyScore ?? null)
            : (t1.penaltyScore ?? null),
        },
        team2: {
          ...t2,
          score: hasPlayedScore ? (dbMatch?.away_score ?? t2.score ?? null) : (t2.score ?? null),
          penaltyScore: hasPlayedScore
            ? (dbMatch?.away_penalty_score ?? t2.penaltyScore ?? null)
            : (t2.penaltyScore ?? null),
        },
      };
    };

    bracketData.qfMatches = bracketData.qfMatches.map(enrichMatchup);
    bracketData.sfMatches = bracketData.sfMatches.map(enrichMatchup);
    bracketData.thirdPlaceMatch = enrichMatchup(bracketData.thirdPlaceMatch);
    bracketData.finalMatch = enrichMatchup(bracketData.finalMatch);

    const resolvedBracketData = this.advanceBracketWinners(
      bracketData,
      startingRound,
      baseMatchNumber
    );

    const groupSeeds = this.buildGroupSeeds(groups, teams);

    const activeBracketSlots: any[] =
      startingRound === 'qf'
        ? [
            ...resolvedBracketData.qfMatches,
            ...resolvedBracketData.sfMatches,
            resolvedBracketData.thirdPlaceMatch,
            resolvedBracketData.finalMatch,
          ]
        : startingRound === 'final'
        ? [resolvedBracketData.finalMatch]
        : [
            ...resolvedBracketData.sfMatches,
            resolvedBracketData.thirdPlaceMatch,
            resolvedBracketData.finalMatch,
          ];

    const configuredSlotsCount = activeBracketSlots.filter((s) =>
      this.hasFeederMatchConfigured(s)
    ).length;

    return {
      knockout_starting_round: startingRound,
      is_bracket_locked: Boolean(tourney.is_bracket_locked),
      is_knockout_created:
        Boolean(tourney.is_knockout_created) || configuredSlotsCount > 0,
      base_match_number: baseMatchNumber,
      group_seeds: groupSeeds,
      bracket_data: resolvedBracketData,
      teams: teams.map((t) => ({
        id: String(t.id),
        name: t.name,
        shortName: t.short_name || t.name.slice(0, 3).toUpperCase(),
        logo: (t as any).logo_url || t.logo || '',
        group_name: t.group_name || null,
      })),
      knockout_matches_count: Math.max(
        knockoutMatches.length,
        configuredSlotsCount
      ),
    };
  }

  async autoSeedBracketFromStandings(id: string): Promise<any> {
    const current = await this.getBracket(id);
    const startingRound = current.knockout_starting_round || 'sf';
    const bracketData = this.buildDefaultBracketData(current.bracket_data);
    this.assignBracketMatchNumbers(
      bracketData,
      startingRound,
      Number(current.base_match_number) || 0
    );

    const { matchService } = await import('./match.service.ts');
    const standingsOverview = await matchService.getGroupStandings(id);
    const groupsMap = standingsOverview.groups || {};
    const groupKeys = Object.keys(groupsMap);

    // Map clean group letter ("A", "B", ...) to its standings array
    const standingsByLetter = new Map<string, any[]>();
    for (const key of groupKeys) {
      const letter = key
        .replace(/^(กลุ่ม|สาย|Group)\s*/i, '')
        .trim()
        .toUpperCase();
      standingsByLetter.set(letter, groupsMap[key] || []);
    }

    const toSlotTeam = (row?: any, seedCode?: string | null) => {
      if (!row) {
        return {
          id: null,
          name: seedCode || '-',
          seedCode: seedCode || null,
          shortName: '',
          logo: '',
          score: null,
          penaltyScore: null,
        };
      }
      return {
        id: String(row.teamId),
        name: row.teamName,
        seedCode: seedCode || null,
        shortName: row.shortName || row.teamName.slice(0, 3).toUpperCase(),
        logo: row.teamLogo || '',
        score: null,
        penaltyScore: null,
      };
    };

    const resolveBySeedCode = (seedCode: string) => {
      const match = seedCode.trim().match(/^([A-Z])(\d+)$/i);
      if (!match) return undefined;
      const letter = match[1].toUpperCase();
      const rankIdx = Math.max(0, parseInt(match[2], 10) - 1);
      const groupRows = standingsByLetter.get(letter);
      return groupRows ? groupRows[rankIdx] : undefined;
    };

    const getRankTeam = (gIdx: number, rankIdx: number) => {
      const gKey = groupKeys[gIdx];
      if (!gKey || !groupsMap[gKey]) return undefined;
      return groupsMap[gKey][rankIdx];
    };

    const resolveSlotOrFallback = (
      existingTeamSlot: any,
      defaultSeedCode: string,
      fallbackRow?: any
    ) => {
      const candidateSeed =
        existingTeamSlot?.seedCode ||
        (existingTeamSlot?.name &&
        /^([A-Z])(\d+)$/i.test(String(existingTeamSlot.name).trim())
          ? String(existingTeamSlot.name).trim().toUpperCase()
          : null);

      if (candidateSeed) {
        const row = resolveBySeedCode(candidateSeed);
        return toSlotTeam(row, candidateSeed);
      }

      const defaultRow = resolveBySeedCode(defaultSeedCode) || fallbackRow;
      return toSlotTeam(defaultRow, defaultSeedCode);
    };

    if (startingRound === 'qf') {
      const defaultPairs: Array<[string, string, any, any]> = [
        ['A1', 'B2', getRankTeam(0, 0), getRankTeam(1, 1)],
        ['B1', 'A2', getRankTeam(1, 0), getRankTeam(0, 1)],
        ['C1', 'D2', getRankTeam(2, 0), getRankTeam(3, 1)],
        ['D1', 'C2', getRankTeam(3, 0), getRankTeam(2, 1)],
      ];

      bracketData.qfMatches.forEach((m: any, idx: number) => {
        const [s1, s2, r1, r2] = defaultPairs[idx] || ['A1', 'B2', undefined, undefined];
        m.team1 = resolveSlotOrFallback(m.team1, s1, r1);
        m.team2 = resolveSlotOrFallback(m.team2, s2, r2);
      });
    } else if (startingRound === 'sf') {
      const defaultPairs: Array<[string, string, any, any]> = [
        ['A1', 'B2', getRankTeam(0, 0), getRankTeam(1, 1)],
        ['B1', 'A2', getRankTeam(1, 0), getRankTeam(0, 1)],
      ];

      bracketData.sfMatches.forEach((m: any, idx: number) => {
        const [s1, s2, r1, r2] = defaultPairs[idx] || ['A1', 'B2', undefined, undefined];
        m.team1 = resolveSlotOrFallback(m.team1, s1, r1);
        m.team2 = resolveSlotOrFallback(m.team2, s2, r2);
      });
    } else if (startingRound === 'final') {
      bracketData.finalMatch.team1 = resolveSlotOrFallback(
        bracketData.finalMatch.team1,
        'A1',
        getRankTeam(0, 0)
      );
      bracketData.finalMatch.team2 = resolveSlotOrFallback(
        bracketData.finalMatch.team2,
        'B1',
        getRankTeam(1, 0) || getRankTeam(0, 1)
      );
    }

    return {
      ...current,
      is_knockout_created: true,
      bracket_data: this.advanceBracketWinners(
        bracketData,
        startingRound,
        Number(current.base_match_number) || 0
      ),
    };
  }

  async updateBracket(
    id: string,
    payload: {
      bracket_data?: any;
      is_bracket_locked?: boolean;
      is_knockout_created?: boolean;
      knockout_starting_round?: 'qf' | 'sf' | 'final';
    }
  ): Promise<any> {
    const tourney = await this.getTournamentById(id);
    const startingRound =
      payload.knockout_starting_round || tourney.knockout_starting_round || 'sf';

    const { teamRepository } = await import('../repositories/team.repository.ts');
    const { matchRepository } = await import('../repositories/match.repository.ts');

    const [teams, allMatches] = await Promise.all([
      teamRepository.findByTournament(id),
      matchRepository.findByTournament(id),
    ]);

    const teamById = new Map<string, any>();
    const teamByName = new Map<string, any>();
    for (const t of teams) {
      teamById.set(String(t.id), t);
      if (t.name) teamByName.set(t.name.trim().toLowerCase(), t);
    }

    const resolveTeamId = (slotTeam: any): string | null => {
      if (!slotTeam) return null;
      if (slotTeam.id && teamById.has(String(slotTeam.id))) {
        return String(slotTeam.id);
      }
      if (slotTeam.name && slotTeam.name !== '-') {
        const found = teamByName.get(String(slotTeam.name).trim().toLowerCase());
        if (found) return String(found.id);
      }
      return null;
    };

    const groupMatches = allMatches.filter((m) => !m.stage || m.stage === 'group');
    const existingKnockoutMatches = allMatches.filter(
      (m) => m.stage && m.stage !== 'group'
    );

    const maxGroupMatchNum = groupMatches.reduce(
      (max, m) => Math.max(max, Number(m.match_number) || 0),
      0
    );
    const baseMatchNumber =
      maxGroupMatchNum > 0 ? maxGroupMatchNum : groupMatches.length;

    // 1. Preserve existing date/time/venue from stored bracket_data before advancing winners
    const storedBracket = this.buildDefaultBracketData(tourney.bracket_data);
    const storedSlotById = new Map<string, any>();
    [
      ...(storedBracket.qfMatches || []),
      ...(storedBracket.sfMatches || []),
      storedBracket.thirdPlaceMatch,
      storedBracket.finalMatch,
    ].forEach((s) => {
      if (s?.id) storedSlotById.set(String(s.id), s);
    });

    const advancedBracket = this.advanceBracketWinners(
      payload.bracket_data || tourney.bracket_data || {},
      startingRound,
      baseMatchNumber
    );

    const preserveSlotSchedule = (slot: any) => {
      if (!slot) return slot;
      const prev = storedSlotById.get(String(slot.id));
      if (!prev) return slot;
      return {
        ...slot,
        date:
          slot.date && slot.date !== 'TBD' && slot.date !== '2 พ.ย. 2026'
            ? slot.date
            : prev.date || slot.date || 'TBD',
        time: slot.time || prev.time || '16:00',
        venue:
          slot.venue &&
          slot.venue !== 'สนามหลัก (รอบชิง)' &&
          slot.venue !== 'สนามหลัก'
            ? slot.venue
            : prev.venue || slot.venue || 'สนาม 1',
      };
    };

    advancedBracket.qfMatches = advancedBracket.qfMatches.map(preserveSlotSchedule);
    advancedBracket.sfMatches = advancedBracket.sfMatches.map(preserveSlotSchedule);
    advancedBracket.thirdPlaceMatch = preserveSlotSchedule(
      advancedBracket.thirdPlaceMatch
    );
    advancedBracket.finalMatch = preserveSlotSchedule(advancedBracket.finalMatch);

    const resolveSlotParticipant = (
      slotTeam: any
    ): { teamId: string | null; participantValue: string | null } => {
      const teamId = resolveTeamId(slotTeam);
      if (teamId) {
        return { teamId, participantValue: teamId };
      }
      const rawName = slotTeam?.name ? String(slotTeam.name).trim() : '';
      if (rawName && rawName !== '-') {
        return { teamId: null, participantValue: rawName };
      }
      return { teamId: null, participantValue: null };
    };

    const hasAnyConfiguredSlot = [
      ...advancedBracket.qfMatches,
      ...advancedBracket.sfMatches,
      advancedBracket.thirdPlaceMatch,
      advancedBracket.finalMatch,
    ].some((s) => this.hasFeederMatchConfigured(s));

    const isKnockoutCreated =
      payload.is_knockout_created !== undefined
        ? Boolean(payload.is_knockout_created) || hasAnyConfiguredSlot
        : Boolean(tourney.is_knockout_created) || hasAnyConfiguredSlot;

    // 2. Sync knockout matches to public.matches while keeping all group matches untouched

    const activeSlots: any[] = !isKnockoutCreated
      ? []
      : startingRound === 'qf'
      ? [
          ...advancedBracket.qfMatches,
          ...advancedBracket.sfMatches,
          advancedBracket.thirdPlaceMatch,
          advancedBracket.finalMatch,
        ]
      : startingRound === 'final'
      ? [advancedBracket.finalMatch]
      : [
          ...advancedBracket.sfMatches,
          advancedBracket.thirdPlaceMatch,
          advancedBracket.finalMatch,
        ];

    const keptKnockoutMatchIds = new Set<string>();

    for (const slot of activeSlots) {
      const homeParticipant = resolveSlotParticipant(slot.team1);
      const awayParticipant = resolveSlotParticipant(slot.team2);
      const targetMatchNumber = Number(slot.matchNumber) || baseMatchNumber + 1;

      slot.team1.id = homeParticipant.teamId;
      slot.team2.id = awayParticipant.teamId;

      const homeVal =
        homeParticipant.teamId ||
        homeParticipant.participantValue ||
        (slot.team1?.name && slot.team1.name !== '-' ? slot.team1.name : null);
      const awayVal =
        awayParticipant.teamId ||
        awayParticipant.participantValue ||
        (slot.team2?.name && slot.team2.name !== '-' ? slot.team2.name : null);

      if (homeVal && awayVal) {
        const existingMatch = existingKnockoutMatches.find(
          (km) =>
            (slot.matchId && String(km.id) === String(slot.matchId)) ||
            Number(km.match_number) === targetMatchNumber
        );

        try {
          if (existingMatch) {
            keptKnockoutMatchIds.add(String(existingMatch.id));
            await matchRepository.update(id, String(existingMatch.id), {
              match_number: targetMatchNumber,
              stage: 'knockout',
              round_name: slot.roundName,
              group_name: 'Knockout',
              home_team_id: homeVal,
              away_team_id: awayVal,
              match_date: slot.date || existingMatch.match_date || 'TBD',
              match_time: slot.time || existingMatch.match_time || '16:00',
              venue: slot.venue || existingMatch.venue || 'สนาม 1',
            });
            slot.matchId = String(existingMatch.id);
          } else {
            const created = await matchRepository.create({
              tournament_id: id,
              match_number: targetMatchNumber,
              matchday: 1,
              stage: 'knockout',
              round_name: slot.roundName,
              group_name: 'Knockout',
              home_team_id: homeVal,
              away_team_id: awayVal,
              match_date: slot.date || 'TBD',
              match_time: slot.time || '16:00',
              venue: slot.venue || 'สนาม 1',
              status: 'SCHEDULED',
              home_score: 0,
              away_score: 0,
            });
            keptKnockoutMatchIds.add(String(created.id));
            slot.matchId = String(created.id);
          }
        } catch (err) {
          console.warn('[updateBracket] Direct public.matches insert notice for slot:', slot.id, err);
        }
      } else {
        slot.matchId = null;
      }
    }

    // Delete any removed knockout matches from public.matches
    for (const km of existingKnockoutMatches) {
      if (!keptKnockoutMatchIds.has(String(km.id))) {
        try {
          await matchRepository.delete(id, String(km.id));
        } catch (err) {
          console.warn('[updateBracket] Could not delete old knockout match:', km.id, err);
        }
      }
    }

    // 3. Persist updated bracket metadata to public.tournaments
    await tournamentRepository.update(id, {
      bracket_data: advancedBracket,
      is_bracket_locked:
        payload.is_bracket_locked !== undefined
          ? payload.is_bracket_locked
          : tourney.is_bracket_locked,
      is_knockout_created: isKnockoutCreated,
      knockout_starting_round: startingRound,
    });

    return this.getBracket(id);
  }

  async syncBracketScheduleFromMatches(
    id: string,
    knockoutItems: Array<{
      id?: string | number;
      match_number: number;
      round_name?: string | null;
      match_date: string;
      match_time: string;
      venue: string;
    }>,
    clearAll: boolean = false
  ): Promise<void> {
    const tourney = await this.getTournamentById(id);
    if (clearAll) {
      await tournamentRepository.update(id, {
        bracket_data: {},
        is_knockout_created: false,
      });
      return;
    }

    if (!knockoutItems || knockoutItems.length === 0) return;

    const startingRound = tourney.knockout_starting_round || 'sf';
    const bData = this.buildDefaultBracketData(tourney.bracket_data);

    const { matchRepository } = await import('../repositories/match.repository.ts');
    const allMatches = await matchRepository.findByTournament(id);
    const groupMatches = allMatches.filter((m) => !m.stage || m.stage === 'group');
    const maxGroupMatchNum = groupMatches.reduce(
      (max, m) => Math.max(max, Number(m.match_number) || 0),
      0
    );
    const baseMatchNumber =
      maxGroupMatchNum > 0 ? maxGroupMatchNum : groupMatches.length;

    this.assignBracketMatchNumbers(bData, startingRound, baseMatchNumber);

    const bySlotId = new Map<string, (typeof knockoutItems)[0]>();
    const byMatchId = new Map<string, (typeof knockoutItems)[0]>();
    const byMatchNumber = new Map<number, (typeof knockoutItems)[0]>();
    const byRoundAndIndex = new Map<string, (typeof knockoutItems)[0]>();
    const roundCounter = new Map<string, number>();

    for (const item of knockoutItems) {
      const rawId = String(item.id || '');
      if (rawId.startsWith('bracket_')) {
        bySlotId.set(rawId.replace(/^bracket_/, ''), item);
      } else if (rawId) {
        byMatchId.set(rawId, item);
      }
      if (item.match_number) {
        byMatchNumber.set(Number(item.match_number), item);
      }
      if (item.round_name) {
        const rName = item.round_name.trim();
        const rIdx = roundCounter.get(rName) || 0;
        byRoundAndIndex.set(`${rName}#${rIdx}`, item);
        roundCounter.set(rName, rIdx + 1);
      }
    }

    const applySlotUpdate = (slot: any, roundIdx: number) => {
      if (!slot) return slot;
      const found =
        bySlotId.get(String(slot.id)) ||
        (slot.matchId ? byMatchId.get(String(slot.matchId)) : undefined) ||
        byMatchNumber.get(Number(slot.matchNumber)) ||
        byRoundAndIndex.get(`${slot.roundName}#${roundIdx}`);
      if (!found) return slot;
      return {
        ...slot,
        matchNumber: found.match_number || slot.matchNumber,
        date: found.match_date || 'TBD',
        time: found.match_time || '16:00',
        venue: found.venue || 'สนาม 1',
      };
    };

    bData.qfMatches = bData.qfMatches.map((s: any, idx: number) =>
      applySlotUpdate(s, idx)
    );
    bData.sfMatches = bData.sfMatches.map((s: any, idx: number) =>
      applySlotUpdate(s, idx)
    );
    bData.thirdPlaceMatch = applySlotUpdate(bData.thirdPlaceMatch, 0);
    bData.finalMatch = applySlotUpdate(bData.finalMatch, 0);

    await tournamentRepository.update(id, {
      bracket_data: bData,
    });
  }
}

export const tournamentService = new TournamentService();
