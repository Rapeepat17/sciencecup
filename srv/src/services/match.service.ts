import { matchRepository } from '../repositories/match.repository.ts';
import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { teamRepository } from '../repositories/team.repository.ts';
import { standingsService } from './standings.service.ts';
import { teamService } from './team.service.ts';
import { Match, MatchEvent, Team } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class MatchService {
  private enrichMatches(rawMatches: Match[], teams: Team[]): any[] {
    const teamMap = new Map<string, Team>();
    for (const t of teams) {
      teamMap.set(String(t.id), t);
    }

    return rawMatches.map((m, idx) => {
      const homeTeamRecord = teamMap.get(String(m.home_team_id));
      const awayTeamRecord = teamMap.get(String(m.away_team_id));

      const matchNumber = m.match_number ?? idx + 1;
      const venue = m.venue || m.pitch || 'สนามหลัก';
      const roundName =
        m.round_name ||
        (m.stage === 'group' ? 'รอบแบ่งกลุ่ม (Group Stage)' : m.stage);
      const groupName =
        m.group_name ||
        homeTeamRecord?.group_name ||
        (m.stage === 'group' ? 'A' : 'Knockout');

      const fallbackHomeName =
        (m as any).home_team_name ||
        (m.home_team_id && String(m.home_team_id).trim() !== ''
          ? String(m.home_team_id).trim()
          : 'รอระบุทีม');

      const fallbackAwayName =
        (m as any).away_team_name ||
        (m.away_team_id && String(m.away_team_id).trim() !== ''
          ? String(m.away_team_id).trim()
          : 'รอระบุทีม');

      const team1Obj = {
        id: m.home_team_id,
        name: homeTeamRecord?.name || fallbackHomeName,
        shortName:
          homeTeamRecord?.short_name ||
          (homeTeamRecord?.name || fallbackHomeName).slice(0, 3).toUpperCase(),
        logo: homeTeamRecord?.logo || (m as any).home_team_logo || '',
        group: homeTeamRecord?.group_name || groupName,
      };

      const team2Obj = {
        id: m.away_team_id,
        name: awayTeamRecord?.name || fallbackAwayName,
        shortName:
          awayTeamRecord?.short_name ||
          (awayTeamRecord?.name || fallbackAwayName).slice(0, 3).toUpperCase(),
        logo: awayTeamRecord?.logo || (m as any).away_team_logo || '',
        group: awayTeamRecord?.group_name || groupName,
      };

      const rawStatus = (m.status || 'SCHEDULED').toUpperCase();
      const uiStatus =
        rawStatus === 'LIVE'
          ? 'LIVE'
          : rawStatus === 'COMPLETED' || rawStatus === 'FT'
            ? 'FT'
            : rawStatus === 'POSTPONED'
              ? 'POSTPONED'
              : 'UPCOMING';

      return {
        // Canonical DB fields
        id: String(m.id),
        tournament_id: String(m.tournament_id),
        match_number: matchNumber,
        matchday: m.matchday ?? 1,
        stage: m.stage || 'group',
        round_name: roundName,
        group_name: groupName,
        home_team_id: String(m.home_team_id),
        away_team_id: String(m.away_team_id),
        home_team_name: team1Obj.name,
        away_team_name: team2Obj.name,
        home_team_logo: team1Obj.logo,
        away_team_logo: team2Obj.logo,
        home_score: m.home_score ?? 0,
        away_score: m.away_score ?? 0,
        home_penalty_score: m.home_penalty_score ?? null,
        away_penalty_score: m.away_penalty_score ?? null,
        match_date: m.match_date || '',
        match_time: m.match_time || '',
        venue,
        status: uiStatus,

        // Frontend schedule fields
        tournamentId: String(m.tournament_id),
        matchNumber,
        dateStr: m.match_date || '',
        timeStr: m.match_time || '',
        round: roundName,
        group: groupName,
        team1: team1Obj,
        team2: team2Obj,
        score1: m.home_score !== null && m.home_score !== undefined ? Number(m.home_score) : 0,
        score2: m.away_score !== null && m.away_score !== undefined ? Number(m.away_score) : 0,
        penaltyScore1: m.home_penalty_score ?? null,
        penaltyScore2: m.away_penalty_score ?? null,
      };
    });
  }

  async getMatches(tournamentId: string, stage?: string): Promise<any[]> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    const [rawMatches, teams] = await Promise.all([
      matchRepository.findByTournament(tournamentId, stage),
      teamRepository.findByTournament(tournamentId),
    ]);

    const enriched = this.enrichMatches(rawMatches, teams);

    // Merge configured knockout bracket slots from tournament.bracket_data when not filtering solely for 'group'
    if (stage !== 'group') {
      try {
        const { tournamentService } = await import('./tournament.service.ts');
        const bracketInfo = await tournamentService.getBracket(tournamentId);

        if (bracketInfo?.is_knockout_created && bracketInfo?.bracket_data) {
          const startingRound = bracketInfo.knockout_starting_round || 'sf';
          const bData = bracketInfo.bracket_data;
          const activeSlots: any[] =
            startingRound === 'qf'
              ? [
                  ...(bData.qfMatches || []),
                  ...(bData.sfMatches || []),
                  bData.thirdPlaceMatch,
                  bData.finalMatch,
                ]
              : startingRound === 'final'
              ? [bData.finalMatch]
              : [
                  ...(bData.sfMatches || []),
                  bData.thirdPlaceMatch,
                  bData.finalMatch,
                ];

          for (const slot of activeSlots) {
            if (!slot) continue;
            const t1Name = slot.team1?.name ? String(slot.team1.name).trim() : '-';
            const t2Name = slot.team2?.name ? String(slot.team2.name).trim() : '-';
            if (t1Name === '-' && t2Name === '-') continue;

            const targetMatchNumber = Number(slot.matchNumber);

            const existingMatch = enriched.find(
              (m) =>
                (slot.matchId && String(m.id) === String(slot.matchId)) ||
                String(m.id) === `bracket_${slot.id}` ||
                String(m.id) === String(slot.id) ||
                (targetMatchNumber > 0 && Number(m.match_number) === targetMatchNumber)
            );

            if (existingMatch) {
              // Update team names/logos if existing has generic fallback names
              if (
                (!existingMatch.home_team_name ||
                  existingMatch.home_team_name === 'รอระบุทีม' ||
                  existingMatch.home_team_name === 'ทีมเหย้า') &&
                t1Name !== '-'
              ) {
                existingMatch.home_team_name = t1Name;
                if (existingMatch.team1) {
                  existingMatch.team1.name = t1Name;
                  existingMatch.team1.shortName =
                    slot.team1?.shortName || t1Name.slice(0, 3).toUpperCase();
                  existingMatch.team1.logo =
                    slot.team1?.logo || existingMatch.team1.logo || '';
                }
              }

              if (
                (!existingMatch.away_team_name ||
                  existingMatch.away_team_name === 'รอระบุทีม' ||
                  existingMatch.away_team_name === 'ทีมเยือน') &&
                t2Name !== '-'
              ) {
                existingMatch.away_team_name = t2Name;
                if (existingMatch.team2) {
                  existingMatch.team2.name = t2Name;
                  existingMatch.team2.shortName =
                    slot.team2?.shortName || t2Name.slice(0, 3).toUpperCase();
                  existingMatch.team2.logo =
                    slot.team2?.logo || existingMatch.team2.logo || '';
                }
              }

              if (slot.roundName && (!existingMatch.round_name || existingMatch.round_name.includes('Group Stage'))) {
                existingMatch.round_name = slot.roundName;
                existingMatch.round = slot.roundName;
              }

              continue;
            }

            const matchNumber = targetMatchNumber || enriched.length + 1;
            const venue = slot.venue || 'สนามหลัก';
            const roundName = slot.roundName || 'รอบน็อคเอาท์';
            const groupName = 'Knockout';
            const matchIdStr = slot.matchId
              ? String(slot.matchId)
              : `bracket_${slot.id}`;
            const homeIdStr = slot.team1?.id
              ? String(slot.team1.id)
              : t1Name !== '-'
              ? t1Name
              : 'รอระบุทีม';
            const awayIdStr = slot.team2?.id
              ? String(slot.team2.id)
              : t2Name !== '-'
              ? t2Name
              : 'รอระบุทีม';

            const team1Obj = {
              id: homeIdStr,
              name: t1Name !== '-' ? t1Name : 'รอระบุทีม',
              shortName:
                slot.team1?.shortName ||
                (t1Name !== '-' ? t1Name.slice(0, 3).toUpperCase() : 'TBD'),
              logo: slot.team1?.logo || '',
              group: groupName,
            };

            const team2Obj = {
              id: awayIdStr,
              name: t2Name !== '-' ? t2Name : 'รอระบุทีม',
              shortName:
                slot.team2?.shortName ||
                (t2Name !== '-' ? t2Name.slice(0, 3).toUpperCase() : 'TBD'),
              logo: slot.team2?.logo || '',
              group: groupName,
            };

            const rawStatus = String(slot.status || 'SCHEDULED').toUpperCase();
            const uiStatus =
              rawStatus === 'LIVE'
                ? 'LIVE'
                : rawStatus === 'COMPLETED' ||
                  rawStatus === 'FT' ||
                  rawStatus === 'FINISHED'
                ? 'FT'
                : rawStatus === 'POSTPONED'
                ? 'POSTPONED'
                : 'UPCOMING';

            const score1 =
              slot.team1?.score !== null && slot.team1?.score !== undefined
                ? Number(slot.team1.score)
                : 0;
            const score2 =
              slot.team2?.score !== null && slot.team2?.score !== undefined
                ? Number(slot.team2.score)
                : 0;

            enriched.push({
              id: matchIdStr,
              tournament_id: String(tournamentId),
              match_number: matchNumber,
              matchday: 1,
              stage: 'knockout',
              round_name: roundName,
              group_name: groupName,
              home_team_id: homeIdStr,
              away_team_id: awayIdStr,
              home_team_name: team1Obj.name,
              away_team_name: team2Obj.name,
              home_team_logo: team1Obj.logo,
              away_team_logo: team2Obj.logo,
              home_score: score1,
              away_score: score2,
              home_penalty_score: slot.team1?.penaltyScore ?? null,
              away_penalty_score: slot.team2?.penaltyScore ?? null,
              match_date: slot.date || 'TBD',
              match_time: slot.time || '16:00',
              venue,
              status: uiStatus,

              tournamentId: String(tournamentId),
              matchNumber,
              dateStr: slot.date || 'TBD',
              timeStr: slot.time || '16:00',
              round: roundName,
              group: groupName,
              team1: team1Obj,
              team2: team2Obj,
              score1,
              score2,
              penaltyScore1: slot.team1?.penaltyScore ?? null,
              penaltyScore2: slot.team2?.penaltyScore ?? null,
            });
          }

          // Strictly deduplicate by match_number so no duplicate match numbers can ever exist
          const deduped: any[] = [];
          const seenNums = new Set<number>();
          for (const m of enriched) {
            const num = Number(m.match_number);
            if (num > 0) {
              if (seenNums.has(num)) continue;
              seenNums.add(num);
            }
            deduped.push(m);
          }
          enriched.length = 0;
          enriched.push(...deduped);

          enriched.sort(
            (a, b) => (Number(a.match_number) || 0) - (Number(b.match_number) || 0)
          );
        }
      } catch (err) {
        console.warn('[getMatches] Failed to merge knockout bracket slots:', err);
      }
    }

    return enriched;
  }

  async getMatchById(tournamentId: string, matchId: string): Promise<any> {
    const match = await matchRepository.findById(tournamentId, matchId);
    if (!match) {
      const anyMatch = await matchRepository.findAnywhere(matchId);
      if (anyMatch && String(anyMatch.tournament_id) !== String(tournamentId)) {
        throw AppError.badRequest(
          `Match "${matchId}" belongs to another tournament ("${anyMatch.tournament_id}"), cross-tournament access is denied`,
          'CROSS_TOURNAMENT_MISMATCH'
        );
      }
      throw AppError.notFound(`Match "${matchId}" not found in tournament "${tournamentId}"`);
    }

    const [teams, events] = await Promise.all([
      teamRepository.findByTournament(tournamentId),
      matchRepository.getEventsByMatch(tournamentId, matchId),
    ]);

    const [enriched] = this.enrichMatches([match], teams);
    return { ...enriched, events };
  }

  async getMatchEvents(tournamentId: string, matchId: string): Promise<MatchEvent[]> {
    await this.getMatchById(tournamentId, matchId);
    return matchRepository.getEventsByMatch(tournamentId, matchId);
  }

  /**
   * Unified Save for Match Schedule: syncs the entire list of matches for a tournament to Supabase
   */
  async syncMatches(
    tournamentId: string,
    matchesPayload: Array<{
      id?: string | number;
      match_number?: number;
      matchday?: number;
      stage?: string;
      round_name?: string | null;
      group_name?: string | null;
      home_team_id: string | number;
      away_team_id: string | number;
      match_date?: string | null;
      match_time?: string | null;
      venue?: string | null;
      status?: string;
      home_score?: number | null;
      away_score?: number | null;
      home_penalty_score?: number | null;
      away_penalty_score?: number | null;
    }>
  ): Promise<any[]> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    const teams = await teamRepository.findByTournament(tournamentId);
    const validTeamIds = new Set(teams.map((t) => String(t.id)));

    const dbMatchesToSync: Array<any> = [];
    const knockoutScheduleUpdates: Array<{
      id?: string | number;
      match_number: number;
      round_name?: string | null;
      match_date: string;
      match_time: string;
      venue: string;
    }> = [];

    matchesPayload.forEach((m, idx) => {
      const homeIdStr =
        m.home_team_id !== undefined && m.home_team_id !== null
          ? String(m.home_team_id).trim()
          : '';
      const awayIdStr =
        m.away_team_id !== undefined && m.away_team_id !== null
          ? String(m.away_team_id).trim()
          : '';
      const isKnockout =
        (m.stage && m.stage !== 'group') ||
        String(m.id || '').startsWith('bracket_') ||
        m.group_name === 'Knockout' ||
        Boolean(m.round_name && !m.round_name.includes('รอบแบ่งกลุ่ม'));

      const hasValidTeams =
        validTeamIds.has(homeIdStr) && validTeamIds.has(awayIdStr);

      if (!hasValidTeams && !isKnockout) {
        if (!validTeamIds.has(homeIdStr)) {
          throw AppError.badRequest(
            `Home team "${homeIdStr}" does not belong to tournament "${tournamentId}"`,
            'CROSS_TOURNAMENT_MISMATCH'
          );
        }
        if (!validTeamIds.has(awayIdStr)) {
          throw AppError.badRequest(
            `Away team "${awayIdStr}" does not belong to tournament "${tournamentId}"`,
            'CROSS_TOURNAMENT_MISMATCH'
          );
        }
      }

      const matchNumber = m.match_number ?? idx + 1;

      if (isKnockout) {
        knockoutScheduleUpdates.push({
          id: m.id,
          match_number: matchNumber,
          round_name: m.round_name || null,
          match_date: m.match_date || 'TBD',
          match_time: m.match_time || '16:00',
          venue: m.venue || 'สนาม 1',
        });
      }

      const cleanId =
        m.id &&
        !String(m.id).startsWith('bracket_') &&
        !String(m.id).startsWith('temp_') &&
        !String(m.id).startsWith('match-gen-')
          ? m.id
          : undefined;

      dbMatchesToSync.push({
        id: cleanId,
        match_number: matchNumber,
        matchday: m.matchday ?? 1,
        stage: isKnockout ? 'knockout' : m.stage || 'group',
        round_name:
          m.round_name ||
          (isKnockout ? 'รอบน็อคเอาท์' : 'รอบแบ่งกลุ่ม (Group Stage)'),
        group_name: isKnockout ? 'Knockout' : m.group_name ?? null,
        home_team_id: homeIdStr || null,
        away_team_id: awayIdStr || null,
        match_date: m.match_date || '',
        match_time: m.match_time || '',
        venue: m.venue || 'สนาม 1',
        status: m.status || 'SCHEDULED',
        home_score: m.home_score ?? 0,
        away_score: m.away_score ?? 0,
        home_penalty_score: m.home_penalty_score ?? null,
        away_penalty_score: m.away_penalty_score ?? null,
      });
    });

    await matchRepository.syncTournamentMatches(tournamentId, dbMatchesToSync);

    // Sync schedule changes (or Clear All) back into tournament.bracket_data
    try {
      const { tournamentService } = await import('./tournament.service.ts');
      await tournamentService.syncBracketScheduleFromMatches(
        tournamentId,
        knockoutScheduleUpdates,
        matchesPayload.length === 0
      );
    } catch (err) {
      console.warn('[syncMatches] Could not update bracket_data schedule:', err);
    }

    return this.getMatches(tournamentId);
  }

  async createMatch(
    tournamentId: string,
    payload: {
      id?: string | number;
      stage?: 'group' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';
      round_name?: string | null;
      group_name?: string | null;
      home_team_id: string | number;
      away_team_id: string | number;
      match_number?: number;
      matchday?: number;
      match_date?: string | null;
      match_time?: string | null;
      venue?: string | null;
      pitch?: string | null;
    }
  ): Promise<any> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    const homeTeam = await teamRepository.findById(tournamentId, String(payload.home_team_id));
    if (!homeTeam) {
      throw AppError.badRequest(
        `Home team "${payload.home_team_id}" does not belong to tournament "${tournamentId}"`,
        'CROSS_TOURNAMENT_MISMATCH'
      );
    }

    const awayTeam = await teamRepository.findById(tournamentId, String(payload.away_team_id));
    if (!awayTeam) {
      throw AppError.badRequest(
        `Away team "${payload.away_team_id}" does not belong to tournament "${tournamentId}"`,
        'CROSS_TOURNAMENT_MISMATCH'
      );
    }

    const existingMatches = await matchRepository.findByTournament(tournamentId);
    const maxMatchNumber = existingMatches.reduce((max, m) => Math.max(max, m.match_number || 0), 0);

    const createData: any = {
      tournament_id: tournamentId,
      stage: payload.stage || 'group',
      round_name: payload.round_name || 'รอบแบ่งกลุ่ม (Group Stage)',
      group_name: payload.group_name ?? homeTeam.group_name ?? null,
      home_team_id: payload.home_team_id,
      away_team_id: payload.away_team_id,
      match_number: payload.match_number || maxMatchNumber + 1,
      matchday: payload.matchday || 1,
      match_date: payload.match_date || '',
      match_time: payload.match_time || '09:00',
      venue: payload.venue || payload.pitch || 'สนามหลัก',
      status: 'SCHEDULED',
      home_score: 0,
      away_score: 0,
    };

    if (payload.id !== undefined && String(payload.id).trim() !== '') {
      createData.id = payload.id;
    }

    const created = await matchRepository.create(createData);
    return this.getMatchById(tournamentId, String(created.id));
  }

  async updateMatchScore(
    tournamentId: string,
    matchId: string,
    payload: {
      home_score?: number | null;
      away_score?: number | null;
      home_penalty_score?: number | null;
      away_penalty_score?: number | null;
      status?: 'SCHEDULED' | 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'FT' | 'POSTPONED';
      match_date?: string | null;
      match_time?: string | null;
      venue?: string | null;
      pitch?: string | null;
      match_number?: number | null;
      matchday?: number | null;
      round_name?: string | null;
      group_name?: string | null;
    }
  ): Promise<any> {
    if (String(matchId).startsWith('bracket_')) {
      const { tournamentService } = await import('./tournament.service.ts');
      await tournamentService.syncBracketScheduleFromMatches(tournamentId, [
        {
          id: matchId,
          match_number: Number(payload.match_number) || 0,
          round_name: payload.round_name || null,
          match_date: payload.match_date || 'TBD',
          match_time: payload.match_time || '16:00',
          venue: payload.venue || payload.pitch || 'สนาม 1',
        },
      ]);
      const all = await this.getMatches(tournamentId);
      return all.find((m) => String(m.id) === String(matchId)) || null;
    }

    const existing = await matchRepository.findById(tournamentId, matchId);
    if (!existing) {
      throw AppError.notFound(`Match "${matchId}" not found in tournament "${tournamentId}"`);
    }

    const updateFields: Partial<Match> = { ...payload };
    if (payload.pitch !== undefined && payload.venue === undefined) {
      updateFields.venue = payload.pitch;
      delete updateFields.pitch;
    }

    if (!payload.status && payload.home_score !== undefined && payload.home_score !== null && payload.away_score !== undefined && payload.away_score !== null) {
      updateFields.status = 'COMPLETED';
    }

    const updatedMatch = await matchRepository.update(tournamentId, matchId, updateFields);

    if (existing.stage && existing.stage !== 'group') {
      try {
        const { tournamentService } = await import('./tournament.service.ts');
        await tournamentService.syncBracketScheduleFromMatches(tournamentId, [
          {
            id: matchId,
            match_number: Number(updatedMatch.match_number || existing.match_number) || 0,
            round_name: updatedMatch.round_name || existing.round_name || null,
            match_date: updatedMatch.match_date || existing.match_date || 'TBD',
            match_time: updatedMatch.match_time || existing.match_time || '16:00',
            venue: updatedMatch.venue || existing.venue || 'สนาม 1',
          },
        ]);
      } catch (err) {
        console.warn('[updateMatchScore] Could not sync knockout schedule to bracket_data:', err);
      }
    }

    return this.getMatchById(tournamentId, matchId);
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
    const { groupRepository } = await import('../repositories/group.repository.ts');
    const [teams, groupRecords, matches] = await Promise.all([
      teamService.getTeams(tournamentId),
      groupRepository.findByTournament(tournamentId),
      this.getMatches(tournamentId, 'group'),
    ]);
    const definedGroupNames = (groupRecords || []).map((g) => g.name);
    return standingsService.calculateFullStandingsOverview(
      teams,
      matches,
      definedGroupNames
    );
  }
}

export const matchService = new MatchService();
