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
    const emptyTeam = (fallbackName = '-') => ({
      id: null,
      name: fallbackName,
      seedCode: /^[A-Z]\d+$/i.test(fallbackName) ? fallbackName : null,
      shortName: /^[A-Z]\d+$/i.test(fallbackName) ? fallbackName : '',
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
        team1: emptyTeam('A1'),
        team2: emptyTeam('B2'),
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
        team1: emptyTeam('B1'),
        team2: emptyTeam('A2'),
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
        team1: emptyTeam('C1'),
        team2: emptyTeam('D2'),
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
        team1: emptyTeam('D1'),
        team2: emptyTeam('C2'),
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
        team1: emptyTeam('A1'),
        team2: emptyTeam('B2'),
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
        team1: emptyTeam('B1'),
        team2: emptyTeam('A2'),
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
      team1: emptyTeam('ทีมแพ้ รอบรองฯ 1'),
      team2: emptyTeam('ทีมแพ้ รอบรองฯ 2'),
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
      team1: emptyTeam('ทีมชนะ รอบรองฯ 1'),
      team2: emptyTeam('ทีมชนะ รอบรองฯ 2'),
      winner: null,
    };

    const mergeTeam = (defTeam: any, incTeam?: any) => {
      if (!incTeam || typeof incTeam !== 'object') return defTeam;
      const incName =
        incTeam.name !== undefined && incTeam.name !== null
          ? String(incTeam.name).trim()
          : '';
      const isCleared =
        incName === '-' ||
        (incTeam.seedCode === null && !incTeam.id && (!incName || incName === '-'));
      if (isCleared) {
        return {
          id: null,
          name: '-',
          seedCode: null,
          shortName: '',
          logo: '',
          score: null,
          penaltyScore: null,
        };
      }
      const hasRealName = incName && incName !== '-' && incName !== 'TBD';
      if (incTeam.id || hasRealName || incTeam.seedCode) {
        return {
          ...defTeam,
          ...incTeam,
          name: incName || incTeam.seedCode || defTeam.name,
          seedCode:
            incTeam.seedCode ||
            (hasRealName && /^([A-Z])(\d+)$/i.test(incName)
              ? incName.toUpperCase()
              : null),
        };
      }
      return defTeam;
    };

    const mergeSlot = (def: any, incoming?: any) => {
      if (!incoming || typeof incoming !== 'object') return def;
      const cleanDate =
        incoming.date === '2 พ.ย. 2026' ? 'TBD' : incoming.date || def.date;
      const cleanVenue =
        incoming.venue === 'สนามหลัก (รอบชิง)' || incoming.venue === 'สนามหลัก'
          ? def.venue
          : incoming.venue || def.venue;
      const t1 = mergeTeam(def.team1, incoming.team1);
      const t2 = mergeTeam(def.team2, incoming.team2);
      return {
        ...def,
        ...incoming,
        date: cleanDate,
        venue: cleanVenue,
        roundName: def.roundName,
        slotLabel: incoming.slotLabel || def.slotLabel,
        seed1Label:
          t1?.name === '-'
            ? '-'
            : t1?.seedCode ||
              (t1?.name ? t1.name : null) ||
              incoming.seed1Label ||
              def.seed1Label,
        seed2Label:
          t2?.name === '-'
            ? '-'
            : t2?.seedCode ||
              (t2?.name ? t2.name : null) ||
              incoming.seed2Label ||
              def.seed2Label,
        team1: t1,
        team2: t2,
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
    const assignNum = (slot: any, defaultNum: number) => {
      if (!slot) return;
      if (!slot.matchId || !slot.matchNumber) {
        slot.matchNumber = defaultNum;
      }
    };

    if (startingRound === 'qf') {
      bracketData.qfMatches.forEach((m: any, idx: number) => {
        assignNum(m, baseMatchNumber + 1 + idx);
      });
      bracketData.sfMatches.forEach((m: any, idx: number) => {
        assignNum(m, baseMatchNumber + 5 + idx);
      });
      assignNum(bracketData.thirdPlaceMatch, baseMatchNumber + 7);
      assignNum(bracketData.finalMatch, baseMatchNumber + 8);
    } else if (startingRound === 'sf') {
      bracketData.sfMatches.forEach((m: any, idx: number) => {
        assignNum(m, baseMatchNumber + 1 + idx);
      });
      assignNum(bracketData.thirdPlaceMatch, baseMatchNumber + 3);
      assignNum(bracketData.finalMatch, baseMatchNumber + 4);
    } else {
      assignNum(bracketData.finalMatch, baseMatchNumber + 1);
    }
  }

  private normalizeGroupLetter(raw?: string | null): string {
    if (!raw) return '';
    return String(raw)
      .replace(/^(กลุ่ม|สาย|Group)\s*/i, '')
      .trim()
      .toUpperCase();
  }

  private async buildStandingsLookup(id: string): Promise<{
    groupsMap: Record<string, any[]>;
    groupKeys: string[];
    standingsByLetter: Map<string, any[]>;
    seedByTeamId: Map<string, string>;
    resolveBySeed: (seedCode?: string | null) => any | undefined;
  }> {
    const standingsByLetter = new Map<string, any[]>();
    const seedByTeamId = new Map<string, string>();
    let groupsMap: Record<string, any[]> = {};
    let groupKeys: string[] = [];

    try {
      const { matchService } = await import('./match.service.ts');
      const standingsOverview = await matchService.getGroupStandings(id);
      groupsMap = standingsOverview.groups || {};
      groupKeys = Object.keys(groupsMap);

      for (const key of groupKeys) {
        const letter = this.normalizeGroupLetter(key);
        if (!letter) continue;
        const rows = groupsMap[key] || [];
        const existing = standingsByLetter.get(letter) || [];
        if (rows.length > 0 || existing.length === 0) {
          standingsByLetter.set(letter, rows);
        }
      }

      for (const [letter, rows] of standingsByLetter.entries()) {
        rows.forEach((row, idx) => {
          if (row?.teamId) {
            seedByTeamId.set(String(row.teamId), `${letter}${idx + 1}`);
          }
        });
      }
    } catch (err) {
      console.warn('[buildStandingsLookup] Notice:', err);
    }

    const resolveBySeed = (seedCode?: string | null) => {
      if (!seedCode) return undefined;
      const match = String(seedCode).trim().match(/^([A-Z])(\d+)$/i);
      if (!match) return undefined;
      const letter = match[1].toUpperCase();
      const rankIdx = Math.max(0, parseInt(match[2], 10) - 1);
      const groupRows = standingsByLetter.get(letter);
      return groupRows ? groupRows[rankIdx] : undefined;
    };

    return {
      groupsMap,
      groupKeys,
      standingsByLetter,
      seedByTeamId,
      resolveBySeed,
    };
  }

  private parseSlotTeamFromDbValue(
    rawVal: any,
    teamById: Map<string, any>,
    teamByName: Map<string, any>,
    seedByTeamId: Map<string, string>,
    fallbackSeedCode?: string | null
  ): any {
    const val =
      rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';

    if (!val || val === '-' || val === 'TBD' || val === 'รอระบุทีม') {
      return {
        id: null,
        name: '-',
        seedCode: null,
        shortName: '',
        logo: '',
        score: null,
        penaltyScore: null,
      };
    }

    if (/^[A-Z]\d+$/i.test(val)) {
      const seed = val.toUpperCase();
      return {
        id: null,
        name: seed,
        seedCode: seed,
        shortName: seed,
        logo: '',
        score: null,
        penaltyScore: null,
      };
    }

    if (/^(คู่ชนะ|คู่แพ้|ผู้ชนะ|ผู้แพ้|ทีมชนะ|ทีมแพ้)\s*/i.test(val)) {
      return {
        id: null,
        name: val,
        seedCode: null,
        shortName: '',
        logo: '',
        score: null,
        penaltyScore: null,
      };
    }

    const matched = teamById.get(val) || teamByName.get(val.toLowerCase());
    if (matched) {
      const inferredSeed =
        seedByTeamId.get(String(matched.id)) ||
        (fallbackSeedCode && /^[A-Z]\d+$/i.test(fallbackSeedCode)
          ? fallbackSeedCode.toUpperCase()
          : null);
      return {
        id: String(matched.id),
        name: matched.name,
        seedCode: inferredSeed,
        shortName: matched.short_name || matched.name.slice(0, 3).toUpperCase(),
        logo: (matched as any).logo_url || matched.logo || '',
        score: null,
        penaltyScore: null,
      };
    }

    return {
      id: null,
      name: val,
      seedCode: null,
      shortName: val.slice(0, 3).toUpperCase(),
      logo: '',
      score: null,
      penaltyScore: null,
    };
  }

  private findDbMatchForSlot(
    slot: any,
    roundIdx: number,
    knockoutMatches: any[],
    usedMatchIds?: Set<string>
  ): any | undefined {
    if (!slot || !Array.isArray(knockoutMatches) || knockoutMatches.length === 0) {
      return undefined;
    }

    const isAvailable = (km: any) =>
      !usedMatchIds || !usedMatchIds.has(String(km.id));

    const slotRound = String(slot.roundName || '').trim();

    if (slot.matchId) {
      const byId = knockoutMatches.find(
        (km) => isAvailable(km) && String(km.id) === String(slot.matchId)
      );
      if (byId) return byId;
    }

    const byNumAndRound = knockoutMatches.find(
      (km) =>
        isAvailable(km) &&
        Number(km.match_number) === Number(slot.matchNumber) &&
        String(km.round_name || '').trim() === slotRound
    );
    if (byNumAndRound) return byNumAndRound;

    const sameRoundMatches = knockoutMatches
      .filter((km) => String(km.round_name || '').trim() === slotRound)
      .sort(
        (a, b) =>
          (Number(a.match_number) || 0) - (Number(b.match_number) || 0) ||
          String(a.id).localeCompare(String(b.id))
      );

    const byRoundIndex = sameRoundMatches[roundIdx];
    if (byRoundIndex && isAvailable(byRoundIndex)) {
      return byRoundIndex;
    }

    return undefined;
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
    if (/^(คู่ชนะ|คู่แพ้|ผู้ชนะ|ผู้แพ้|ทีมชนะ|ทีมแพ้)\s*/i.test(trimmed)) {
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
      seedCode: /^[A-Z]\d+$/i.test(label) ? label : null,
      shortName: /^[A-Z]\d+$/i.test(label) ? label : '',
      logo: '',
      score: null,
      penaltyScore: null,
    });

    const getWinnerOrPlaceholder = (feederSlot: any, defaultFallback = '-') => {
      const winnerSide = this.resolveSlotWinnerSide(feederSlot);
      if (winnerSide === 1 && feederSlot.team1?.name && !this.isPlaceholderSlotName(feederSlot.team1?.name)) {
        return {
          ...feederSlot.team1,
          score: null,
          penaltyScore: null,
        };
      }
      if (winnerSide === 2 && feederSlot.team2?.name && !this.isPlaceholderSlotName(feederSlot.team2?.name)) {
        return {
          ...feederSlot.team2,
          score: null,
          penaltyScore: null,
        };
      }
      const matchNum = feederSlot?.matchNumber;
      if (matchNum) {
        return makePlaceholderTeam(`ทีมชนะคู่ ${matchNum}`);
      }
      return makePlaceholderTeam(defaultFallback);
    };

    const getLoserOrPlaceholder = (feederSlot: any, defaultFallback = '-') => {
      const winnerSide = this.resolveSlotWinnerSide(feederSlot);
      if (winnerSide === 1 && feederSlot.team2?.name && !this.isPlaceholderSlotName(feederSlot.team2?.name)) {
        return {
          ...feederSlot.team2,
          score: null,
          penaltyScore: null,
        };
      }
      if (winnerSide === 2 && feederSlot.team1?.name && !this.isPlaceholderSlotName(feederSlot.team1?.name)) {
        return {
          ...feederSlot.team1,
          score: null,
          penaltyScore: null,
        };
      }
      const matchNum = feederSlot?.matchNumber;
      if (matchNum) {
        return makePlaceholderTeam(`ทีมแพ้คู่ ${matchNum}`);
      }
      return makePlaceholderTeam(defaultFallback);
    };

    // 1. Advance QF -> SF (Only when startingRound === 'qf')
    if (
      startingRound === 'qf' &&
      Array.isArray(next.qfMatches) &&
      next.qfMatches.length === 4
    ) {
      next.sfMatches[0].team1 = getWinnerOrPlaceholder(next.qfMatches[0], 'ทีมชนะคู่ 16');
      next.sfMatches[0].team2 = getWinnerOrPlaceholder(next.qfMatches[1], 'ทีมชนะคู่ 17');
      next.sfMatches[1].team1 = getWinnerOrPlaceholder(next.qfMatches[2], 'ทีมชนะคู่ 18');
      next.sfMatches[1].team2 = getWinnerOrPlaceholder(next.qfMatches[3], 'ทีมชนะคู่ 19');
    }

    // 2. Advance SF -> Final & Third Place (When startingRound === 'qf' or 'sf')
    if (
      (startingRound === 'qf' || startingRound === 'sf') &&
      Array.isArray(next.sfMatches) &&
      next.sfMatches.length === 2
    ) {
      next.finalMatch.team1 = getWinnerOrPlaceholder(next.sfMatches[0], 'ทีมชนะคู่ 20');
      next.finalMatch.team2 = getWinnerOrPlaceholder(next.sfMatches[1], 'ทีมชนะคู่ 21');
      next.thirdPlaceMatch.team1 = getLoserOrPlaceholder(next.sfMatches[0], 'ทีมแพ้คู่ 20');
      next.thirdPlaceMatch.team2 = getLoserOrPlaceholder(next.sfMatches[1], 'ทีมแพ้คู่ 21');
    }

    return next;
  }

  async getBracket(id: string): Promise<any> {
    const tourney = await this.getTournamentById(id);
    const { teamRepository } = await import('../repositories/team.repository.ts');
    const { matchRepository } = await import('../repositories/match.repository.ts');
    const { groupRepository } = await import('../repositories/group.repository.ts');

    const [teams, allMatches, groups, standingsLookup] = await Promise.all([
      teamRepository.findByTournament(id),
      matchRepository.findByTournament(id),
      groupRepository.findByTournament(id),
      this.buildStandingsLookup(id),
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
          penaltyScore: null,
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
          seedCode:
            slotTeam.seedCode ||
            standingsLookup.seedByTeamId.get(String(matched.id)) ||
            null,
          shortName: matched.short_name || matched.name.slice(0, 3).toUpperCase(),
          logo: (matched as any).logo_url || matched.logo || '',
        };
      }
      return slotTeam;
    };

    const usedDbMatchIds = new Set<string>();

    const enrichMatchup = (m: any, roundIdx: number) => {
      const dbMatch = this.findDbMatchForSlot(
        m,
        roundIdx,
        knockoutMatches,
        usedDbMatchIds
      );

      if (dbMatch) {
        usedDbMatchIds.add(String(dbMatch.id));
      }

      const t1 = dbMatch
        ? this.parseSlotTeamFromDbValue(
            dbMatch.home_team_id,
            teamById,
            teamByName,
            standingsLookup.seedByTeamId
          )
        : enrichTeamSlot(m.team1);

      const t2 = dbMatch
        ? this.parseSlotTeamFromDbValue(
            dbMatch.away_team_id,
            teamById,
            teamByName,
            standingsLookup.seedByTeamId
          )
        : enrichTeamSlot(m.team2);

      const dbStatus = String(dbMatch?.status || '').toUpperCase();
      const hasPlayedScore = ['LIVE', 'FINISHED', 'COMPLETED', 'FT'].includes(dbStatus);

      return {
        ...m,
        hasDbMatch: Boolean(dbMatch),
        matchId: dbMatch ? String(dbMatch.id) : m.matchId || null,
        matchNumber: dbMatch?.match_number
          ? Number(dbMatch.match_number)
          : m.matchNumber,
        status: dbStatus || m.status || 'SCHEDULED',
        date: dbMatch?.match_date || m.date || 'TBD',
        time: dbMatch?.match_time || m.time || '16:00',
        venue: dbMatch?.venue || m.venue || 'สนามหลัก',
        seed1Label:
          t1?.name === '-'
            ? '-'
            : t1?.seedCode || (t1?.name ? t1.name : m.seed1Label || '-'),
        seed2Label:
          t2?.name === '-'
            ? '-'
            : t2?.seedCode || (t2?.name ? t2.name : m.seed2Label || '-'),
        team1: {
          ...t1,
          score: hasPlayedScore
            ? (dbMatch?.home_score ?? t1.score ?? null)
            : (t1.score ?? null),
          penaltyScore: hasPlayedScore
            ? (dbMatch?.home_penalty_score ?? t1.penaltyScore ?? null)
            : (t1.penaltyScore ?? null),
        },
        team2: {
          ...t2,
          score: hasPlayedScore
            ? (dbMatch?.away_score ?? t2.score ?? null)
            : (t2.score ?? null),
          penaltyScore: hasPlayedScore
            ? (dbMatch?.away_penalty_score ?? t2.penaltyScore ?? null)
            : (t2.penaltyScore ?? null),
        },
      };
    };

    bracketData.qfMatches = bracketData.qfMatches.map((m: any, idx: number) =>
      enrichMatchup(m, idx)
    );
    bracketData.sfMatches = bracketData.sfMatches.map((m: any, idx: number) =>
      enrichMatchup(m, idx)
    );
    bracketData.thirdPlaceMatch = enrichMatchup(bracketData.thirdPlaceMatch, 0);
    bracketData.finalMatch = enrichMatchup(bracketData.finalMatch, 0);

    // Automatically resolve seed codes (A1, B2, A3, etc.) from group standings when matches have been played
    if (!tourney.is_bracket_locked) {
      const applySeedToSlot = (
        slotTeam: any,
        defaultSeed: string,
        hasDbMatch: boolean
      ) => {
        if (!slotTeam) {
          return {
            id: null,
            name: '-',
            seedCode: null,
            shortName: '',
            logo: '',
            score: null,
            penaltyScore: null,
          };
        }
        const incName =
          slotTeam.name !== undefined && slotTeam.name !== null
            ? String(slotTeam.name).trim()
            : '';
        const isCleared =
          incName === '-' ||
          (slotTeam.seedCode === null && !slotTeam.id && (!incName || incName === '-'));
        if (isCleared) {
          return {
            id: null,
            name: '-',
            seedCode: null,
            shortName: '',
            logo: '',
            score: null,
            penaltyScore: null,
          };
        }

        const seed =
          slotTeam?.seedCode ||
          (incName && /^([A-Z])(\d+)$/i.test(incName)
            ? incName.toUpperCase()
            : null) ||
          (!hasDbMatch && knockoutMatches.length === 0 ? defaultSeed : null);

        if (seed) {
          const row = standingsLookup.resolveBySeed(seed);
          if (row && row.teamName && row.played > 0) {
            const matched = teamById.get(String(row.teamId));
            return {
              ...slotTeam,
              id: String(row.teamId),
              name: row.teamName,
              seedCode: seed,
              shortName: row.shortName || row.teamName.slice(0, 3).toUpperCase(),
              logo: (matched as any)?.logo_url || matched?.logo || row.teamLogo || '',
            };
          }
          if (!slotTeam.id) {
            return {
              ...slotTeam,
              id: null,
              name: seed,
              seedCode: seed,
              shortName: seed,
              logo: '',
            };
          }
        }
        return slotTeam;
      };

      if (startingRound === 'qf') {
        const qfPairs = [
          ['A1', 'B2'],
          ['B1', 'A2'],
          ['C1', 'D2'],
          ['D1', 'C2'],
        ];
        bracketData.qfMatches.forEach((m: any, idx: number) => {
          const [s1, s2] = qfPairs[idx] || ['A1', 'B2'];
          m.team1 = applySeedToSlot(m.team1, s1, Boolean(m.hasDbMatch));
          m.team2 = applySeedToSlot(m.team2, s2, Boolean(m.hasDbMatch));
          m.seed1Label =
            m.team1?.name === '-'
              ? '-'
              : m.team1?.seedCode || m.team1?.name || '-';
          m.seed2Label =
            m.team2?.name === '-'
              ? '-'
              : m.team2?.seedCode || m.team2?.name || '-';
        });
      } else if (startingRound === 'sf') {
        const sfPairs = [
          ['A1', 'B2'],
          ['B1', 'A2'],
        ];
        bracketData.sfMatches.forEach((m: any, idx: number) => {
          const [s1, s2] = sfPairs[idx] || ['A1', 'B2'];
          m.team1 = applySeedToSlot(m.team1, s1, Boolean(m.hasDbMatch));
          m.team2 = applySeedToSlot(m.team2, s2, Boolean(m.hasDbMatch));
          m.seed1Label =
            m.team1?.name === '-'
              ? '-'
              : m.team1?.seedCode || m.team1?.name || '-';
          m.seed2Label =
            m.team2?.name === '-'
              ? '-'
              : m.team2?.seedCode || m.team2?.name || '-';
        });
      } else if (startingRound === 'final') {
        bracketData.finalMatch.team1 = applySeedToSlot(
          bracketData.finalMatch.team1,
          'A1',
          Boolean(bracketData.finalMatch.hasDbMatch)
        );
        bracketData.finalMatch.team2 = applySeedToSlot(
          bracketData.finalMatch.team2,
          'B1',
          Boolean(bracketData.finalMatch.hasDbMatch)
        );
        bracketData.finalMatch.seed1Label =
          bracketData.finalMatch.team1?.name === '-'
            ? '-'
            : bracketData.finalMatch.team1?.seedCode ||
              bracketData.finalMatch.team1?.name ||
              '-';
        bracketData.finalMatch.seed2Label =
          bracketData.finalMatch.team2?.name === '-'
            ? '-'
            : bracketData.finalMatch.team2?.seedCode ||
              bracketData.finalMatch.team2?.name ||
              '-';
      }
    }

    const resolvedBracketData = this.advanceBracketWinners(
      bracketData,
      startingRound,
      baseMatchNumber
    );

    const groupSeeds = this.buildGroupSeeds(groups, teams);

    const hasKnockoutInDb = knockoutMatches.length > 0;

    return {
      knockout_starting_round: startingRound,
      is_bracket_locked: Boolean(tourney.is_bracket_locked),
      is_knockout_created:
        hasKnockoutInDb || Boolean(tourney.is_knockout_created && tourney.bracket_data),
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
      knockout_matches_count: knockoutMatches.length,
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

    const standingsLookup = await this.buildStandingsLookup(id);
    const { groupsMap, groupKeys, resolveBySeed } = standingsLookup;

    const toSlotTeam = (row?: any, seedCode?: string | null) => {
      if (!row) {
        return {
          id: null,
          name: seedCode || '-',
          seedCode: seedCode || null,
          shortName: seedCode || '',
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
      const incName =
        existingTeamSlot?.name !== undefined && existingTeamSlot?.name !== null
          ? String(existingTeamSlot.name).trim()
          : '';
      const isCleared =
        incName === '-' ||
        (existingTeamSlot?.seedCode === null &&
          !existingTeamSlot?.id &&
          (!incName || incName === '-'));
      if (isCleared) {
        return toSlotTeam(undefined, null);
      }

      const candidateSeed =
        existingTeamSlot?.seedCode ||
        (incName && /^([A-Z])(\d+)$/i.test(incName)
          ? incName.toUpperCase()
          : null);

      if (candidateSeed) {
        const row = resolveBySeed(candidateSeed);
        if (row && row.teamName && row.played > 0) {
          return toSlotTeam(row, candidateSeed);
        }
        return toSlotTeam(undefined, candidateSeed);
      }

      const defaultRow = resolveBySeed(defaultSeedCode) || fallbackRow;
      if (defaultRow && defaultRow.teamName && defaultRow.played > 0) {
        return toSlotTeam(defaultRow, defaultSeedCode);
      }
      return toSlotTeam(undefined, defaultSeedCode);
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

    const advanced = this.advanceBracketWinners(
      bracketData,
      startingRound,
      Number(current.base_match_number) || 0
    );

    return this.updateBracket(id, {
      bracket_data: advanced,
      is_knockout_created: true,
      knockout_starting_round: startingRound,
    });
  }

  async syncBracketFromStandingsAndResults(id: string): Promise<any> {
    const tourney = await tournamentRepository.findById(id);
    if (!tourney) return null;

    const { matchRepository } = await import('../repositories/match.repository.ts');
    const allMatches = await matchRepository.findByTournament(id);
    const existingKnockoutMatches = allMatches.filter(
      (m) => m.stage && m.stage !== 'group'
    );

    // Only sync existing knockout matches; never resurrect deleted matches or create new ones automatically
    if (existingKnockoutMatches.length === 0) {
      return null;
    }

    const bracketInfo = await this.getBracket(id);
    const bData = bracketInfo?.bracket_data;
    if (!bData) return bracketInfo;

    const allSlots: any[] = [
      ...(bData.qfMatches || []),
      ...(bData.sfMatches || []),
      bData.thirdPlaceMatch,
      bData.finalMatch,
    ].filter(Boolean);

    for (const slot of allSlots) {
      if (!slot.matchId) continue;
      const existingMatch = existingKnockoutMatches.find(
        (km) => String(km.id) === String(slot.matchId)
      );
      if (!existingMatch) continue;

      const homeVal = slot.team1?.id
        ? String(slot.team1.id)
        : slot.team1?.name && slot.team1.name !== '-'
        ? String(slot.team1.name)
        : '-';
      const awayVal = slot.team2?.id
        ? String(slot.team2.id)
        : slot.team2?.name && slot.team2.name !== '-'
        ? String(slot.team2.name)
        : '-';

      if (
        String(existingMatch.home_team_id || '') !== homeVal ||
        String(existingMatch.away_team_id || '') !== awayVal
      ) {
        try {
          await matchRepository.update(id, String(existingMatch.id), {
            home_team_id: homeVal,
            away_team_id: awayVal,
          });
        } catch (err) {
          console.warn('[syncBracketFromStandingsAndResults] Update notice:', err);
        }
      }
    }

    return bracketInfo;
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

    const [teams, allMatches, standingsLookup] = await Promise.all([
      teamRepository.findByTournament(id),
      matchRepository.findByTournament(id),
      this.buildStandingsLookup(id),
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

    const normalizedInput = this.buildDefaultBracketData(
      payload.bracket_data || tourney.bracket_data || {}
    );

    const resolveStartingSlotForSave = (slotTeam: any) => {
      if (!slotTeam) {
        return {
          id: null,
          name: '-',
          seedCode: null,
          shortName: '',
          logo: '',
          score: null,
          penaltyScore: null,
        };
      }
      const incName =
        slotTeam.name !== undefined && slotTeam.name !== null
          ? String(slotTeam.name).trim()
          : '';
      const isCleared =
        incName === '-' ||
        (slotTeam.seedCode === null && !slotTeam.id && (!incName || incName === '-'));
      if (isCleared) {
        return {
          id: null,
          name: '-',
          seedCode: null,
          shortName: '',
          logo: '',
          score: slotTeam.score ?? null,
          penaltyScore: slotTeam.penaltyScore ?? null,
        };
      }

      const seed =
        slotTeam.seedCode ||
        (incName && /^([A-Z])(\d+)$/i.test(incName) ? incName.toUpperCase() : null);

      if (seed) {
        const row = standingsLookup.resolveBySeed(seed);
        if (row && row.teamName && row.played > 0) {
          const matched = teamById.get(String(row.teamId));
          return {
            ...slotTeam,
            id: String(row.teamId),
            name: row.teamName,
            seedCode: seed,
            shortName: row.shortName || row.teamName.slice(0, 3).toUpperCase(),
            logo: (matched as any)?.logo_url || matched?.logo || row.teamLogo || '',
          };
        }
        return {
          ...slotTeam,
          id: null,
          name: seed,
          seedCode: seed,
          shortName: seed,
          logo: '',
        };
      }

      const matchedId = resolveTeamId(slotTeam);
      if (matchedId) {
        const matched = teamById.get(matchedId);
        return {
          ...slotTeam,
          id: matchedId,
          name: matched?.name || incName,
          seedCode: standingsLookup.seedByTeamId.get(matchedId) || null,
          shortName:
            matched?.short_name ||
            (matched?.name || incName).slice(0, 3).toUpperCase(),
          logo: (matched as any)?.logo_url || matched?.logo || slotTeam.logo || '',
        };
      }

      return slotTeam;
    };

    if (startingRound === 'qf') {
      normalizedInput.qfMatches = normalizedInput.qfMatches.map((m: any) => ({
        ...m,
        team1: resolveStartingSlotForSave(m.team1),
        team2: resolveStartingSlotForSave(m.team2),
      }));
    } else if (startingRound === 'sf') {
      normalizedInput.sfMatches = normalizedInput.sfMatches.map((m: any) => ({
        ...m,
        team1: resolveStartingSlotForSave(m.team1),
        team2: resolveStartingSlotForSave(m.team2),
      }));
    } else if (startingRound === 'final') {
      normalizedInput.finalMatch = {
        ...normalizedInput.finalMatch,
        team1: resolveStartingSlotForSave(normalizedInput.finalMatch.team1),
        team2: resolveStartingSlotForSave(normalizedInput.finalMatch.team2),
      };
    }

    const advancedBracket = this.advanceBracketWinners(
      normalizedInput,
      startingRound,
      baseMatchNumber
    );

    const resolveSlotParticipant = (
      slotTeam: any
    ): { teamId: string | null; participantValue: string } => {
      const rawName = slotTeam?.name ? String(slotTeam.name).trim() : '';
      if (
        !slotTeam ||
        rawName === '-' ||
        (slotTeam.seedCode === null && !slotTeam.id && !rawName)
      ) {
        return { teamId: null, participantValue: '-' };
      }

      const teamId = resolveTeamId(slotTeam);
      if (teamId) {
        return { teamId, participantValue: teamId };
      }

      if (slotTeam.seedCode) {
        return { teamId: null, participantValue: String(slotTeam.seedCode).trim().toUpperCase() };
      }

      if (rawName) {
        return { teamId: null, participantValue: rawName };
      }

      return { teamId: null, participantValue: '-' };
    };

    const isKnockoutCreated =
      payload.is_knockout_created !== undefined
        ? Boolean(payload.is_knockout_created)
        : existingKnockoutMatches.length > 0 || Boolean(tourney.is_knockout_created);

    // Sync knockout matches to public.matches while keeping all group matches untouched
    const activeSlotsWithRoundIdx: Array<{ slot: any; roundIdx: number }> =
      !isKnockoutCreated
        ? []
        : startingRound === 'qf'
        ? [
            ...advancedBracket.qfMatches.map((slot: any, idx: number) => ({
              slot,
              roundIdx: idx,
            })),
            ...advancedBracket.sfMatches.map((slot: any, idx: number) => ({
              slot,
              roundIdx: idx,
            })),
            { slot: advancedBracket.thirdPlaceMatch, roundIdx: 0 },
            { slot: advancedBracket.finalMatch, roundIdx: 0 },
          ]
        : startingRound === 'final'
        ? [{ slot: advancedBracket.finalMatch, roundIdx: 0 }]
        : [
            ...advancedBracket.sfMatches.map((slot: any, idx: number) => ({
              slot,
              roundIdx: idx,
            })),
            { slot: advancedBracket.thirdPlaceMatch, roundIdx: 0 },
            { slot: advancedBracket.finalMatch, roundIdx: 0 },
          ];

    const keptKnockoutMatchIds = new Set<string>();

    for (const { slot, roundIdx } of activeSlotsWithRoundIdx) {
      if (!slot) continue;
      const homeParticipant = resolveSlotParticipant(slot.team1);
      const awayParticipant = resolveSlotParticipant(slot.team2);
      const targetMatchNumber = Number(slot.matchNumber) || baseMatchNumber + 1;

      slot.team1.id = homeParticipant.teamId;
      slot.team2.id = awayParticipant.teamId;

      const homeVal = homeParticipant.teamId || homeParticipant.participantValue || '-';
      const awayVal = awayParticipant.teamId || awayParticipant.participantValue || '-';

      const existingMatch = this.findDbMatchForSlot(
        slot,
        roundIdx,
        existingKnockoutMatches,
        keptKnockoutMatchIds
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
            match_date:
              slot.date && slot.date !== 'TBD'
                ? slot.date
                : existingMatch.match_date || 'TBD',
            match_time: slot.time || existingMatch.match_time || '16:00',
            venue:
              slot.venue && slot.venue !== 'สนามหลัก'
                ? slot.venue
                : existingMatch.venue || slot.venue || 'สนาม 1',
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
        console.warn(
          '[updateBracket] Direct public.matches insert/update notice for slot:',
          slot.id,
          err
        );
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

    // Persist updated bracket metadata to public.tournaments
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
    if (clearAll || !knockoutItems || knockoutItems.length === 0) {
      const bData = this.buildDefaultBracketData(tourney.bracket_data);
      const clearSlotLink = (slot: any) => ({
        ...slot,
        matchId: null,
      });
      bData.qfMatches = bData.qfMatches.map(clearSlotLink);
      bData.sfMatches = bData.sfMatches.map(clearSlotLink);
      bData.thirdPlaceMatch = clearSlotLink(bData.thirdPlaceMatch);
      bData.finalMatch = clearSlotLink(bData.finalMatch);

      await tournamentRepository.update(id, {
        bracket_data: bData,
        is_knockout_created: false,
      });
      return;
    }

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

      if (!found) {
        // Slot match was deleted from the schedule
        return {
          ...slot,
          matchId: null,
        };
      }

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
      is_knockout_created: true,
    });
  }
}

export const tournamentService = new TournamentService();
