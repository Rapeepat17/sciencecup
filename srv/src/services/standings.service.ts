import type {
  Team,
  Match,
  GroupStandingRow,
  TournamentStandingsResponse,
} from '../types/models.types.ts';

function isPlayedStatus(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'COMPLETED' || s === 'FINISHED' || s === 'FT' || s === 'LIVE';
}

function isCompletedStatus(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'COMPLETED' || s === 'FINISHED' || s === 'FT';
}

function normalizeGroupName(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = String(raw)
    .replace(/^(กลุ่ม|สาย|Group)\s*/i, '')
    .trim();
  if (!cleaned) return '';
  return cleaned.length <= 2 ? cleaned.toUpperCase() : cleaned;
}

export class StandingsService {
  calculateGroupStandings(
    teams: Team[],
    matches: Match[],
    definedGroupNames?: string[]
  ): Record<string, GroupStandingRow[]> {
    const tableMap: Record<string, Record<string, GroupStandingRow>> = {};

    // 0. Pre-create empty group buckets if definedGroupNames are provided
    if (Array.isArray(definedGroupNames) && definedGroupNames.length > 0) {
      for (const gName of definedGroupNames) {
        const clean = normalizeGroupName(gName);
        if (clean && !tableMap[clean]) {
          tableMap[clean] = {};
        }
      }
    }

    const teamById = new Map<string, Team>();
    const teamByName = new Map<string, Team>();
    for (const t of teams) {
      teamById.set(String(t.id), t);
      if (t.name) {
        teamByName.set(t.name.trim().toLowerCase(), t);
      }
    }

    const resolveTeamRecord = (rawRef?: string | number | null): Team | undefined => {
      if (rawRef === null || rawRef === undefined) return undefined;
      const key = String(rawRef).trim();
      if (!key) return undefined;
      return teamById.get(key) || teamByName.get(key.toLowerCase());
    };

    const inferredGroupByTeamId = new Map<string, string>();
    for (const m of matches) {
      if (m.stage && m.stage !== 'group') continue;
      const mGrp = normalizeGroupName(m.group_name);
      if (!mGrp || mGrp.toUpperCase() === 'KNOCKOUT') continue;
      const hTeam = resolveTeamRecord(m.home_team_id);
      const aTeam = resolveTeamRecord(m.away_team_id);
      if (hTeam && !inferredGroupByTeamId.has(String(hTeam.id))) {
        inferredGroupByTeamId.set(String(hTeam.id), mGrp);
      }
      if (aTeam && !inferredGroupByTeamId.has(String(aTeam.id))) {
        inferredGroupByTeamId.set(String(aTeam.id), mGrp);
      }
    }

    const createStandingRow = (team: Team, grp: string): GroupStandingRow => ({
      rank: 1,
      isQualified: false,
      teamId: String(team.id),
      teamName: team.name,
      shortName:
        team.short_name ||
        (team.name ? team.name.slice(0, 3).toUpperCase() : 'TM'),
      teamLogo: (team as any).logo_url || team.logo || null,
      groupName: grp,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    });

    // 1. Initialize records for teams
    for (const team of teams) {
      const rawGrp =
        normalizeGroupName(team.group_name) ||
        inferredGroupByTeamId.get(String(team.id)) ||
        '';
      // If definedGroupNames was provided from DB, skip unassigned teams; otherwise fallback to 'Ungrouped'
      if (!rawGrp && Array.isArray(definedGroupNames)) {
        continue;
      }
      const grp = rawGrp || 'Ungrouped';
      if (!tableMap[grp]) {
        tableMap[grp] = {};
      }
      tableMap[grp][String(team.id)] = createStandingRow(team, grp);
    }

    // 2. Process all played/live group matches in sequence
    const sortedMatches = [...matches].sort(
      (a, b) => (a.match_number || 0) - (b.match_number || 0)
    );

    for (const match of sortedMatches) {
      if (match.stage && match.stage !== 'group') continue;
      if (!isPlayedStatus(match.status)) continue;
      if (match.home_score === null || match.home_score === undefined) continue;
      if (match.away_score === null || match.away_score === undefined) continue;

      const homeTeam = resolveTeamRecord(match.home_team_id);
      const awayTeam = resolveTeamRecord(match.away_team_id);
      const homeKey = homeTeam ? String(homeTeam.id) : String(match.home_team_id);
      const awayKey = awayTeam ? String(awayTeam.id) : String(match.away_team_id);

      const rawGrp = normalizeGroupName(match.group_name);
      // Locate group bucket either by normalized match.group_name or by looking up homeKey & awayKey
      let grp = rawGrp;
      if (
        !grp ||
        !tableMap[grp] ||
        !tableMap[grp][homeKey] ||
        !tableMap[grp][awayKey]
      ) {
        const foundGroup = Object.keys(tableMap).find(
          (gKey) => tableMap[gKey][homeKey] && tableMap[gKey][awayKey]
        );
        if (foundGroup) {
          grp = foundGroup;
        } else if (rawGrp && homeTeam && awayTeam) {
          if (!tableMap[rawGrp]) tableMap[rawGrp] = {};
          if (!tableMap[rawGrp][homeKey]) {
            tableMap[rawGrp][homeKey] = createStandingRow(homeTeam, rawGrp);
          }
          if (!tableMap[rawGrp][awayKey]) {
            tableMap[rawGrp][awayKey] = createStandingRow(awayTeam, rawGrp);
          }
          grp = rawGrp;
        }
      }
      if (!grp || !tableMap[grp]) continue;

      const home = tableMap[grp][homeKey];
      const away = tableMap[grp][awayKey];
      if (!home || !away) continue;

      const hScore = Number(match.home_score);
      const aScore = Number(match.away_score);

      home.played += 1;
      away.played += 1;
      home.goalsFor += hScore;
      home.goalsAgainst += aScore;
      away.goalsFor += aScore;
      away.goalsAgainst += hScore;

      if (hScore > aScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
        home.form = [...(home.form || []), 'W' as const].slice(-5);
        away.form = [...(away.form || []), 'L' as const].slice(-5);
      } else if (hScore < aScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
        away.form = [...(away.form || []), 'W' as const].slice(-5);
        home.form = [...(home.form || []), 'L' as const].slice(-5);
      } else {
        home.drawn += 1;
        home.points += 1;
        away.drawn += 1;
        away.points += 1;
        home.form = [...(home.form || []), 'D' as const].slice(-5);
        away.form = [...(away.form || []), 'D' as const].slice(-5);
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    // 3. Sort each group: Points DESC, GoalDifference DESC, GoalsFor DESC, TeamName ASC
    const sortedResult: Record<string, GroupStandingRow[]> = {};
    const sortedGroupKeys = Object.keys(tableMap).sort((a, b) =>
      a.localeCompare(b, 'th')
    );

    for (const grp of sortedGroupKeys) {
      const teamRows = tableMap[grp];
      const sortedRows = Object.values(teamRows).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamName.localeCompare(b.teamName, 'th');
      });

      sortedResult[grp] = sortedRows.map((row, index) => ({
        ...row,
        rank: index + 1,
        isQualified: index < 2,
      }));
    }

    return sortedResult;
  }

  calculateFullStandingsOverview(
    teams: Team[],
    matches: any[],
    definedGroupNames: string[] = []
  ): TournamentStandingsResponse {
    const groupMatches = matches.filter(
      (m) => !m.stage || m.stage === 'group'
    );

    const groups = this.calculateGroupStandings(
      teams,
      groupMatches,
      definedGroupNames
    );

    let completedMatches = 0;
    let liveMatches = 0;
    let totalGoals = 0;

    for (const m of groupMatches) {
      const s = String(m.status || '').toUpperCase();
      if (isCompletedStatus(s)) {
        completedMatches += 1;
      } else if (s === 'LIVE') {
        liveMatches += 1;
      }

      if (
        isPlayedStatus(s) &&
        m.home_score !== null &&
        m.home_score !== undefined &&
        m.away_score !== null &&
        m.away_score !== undefined
      ) {
        totalGoals += Number(m.home_score) + Number(m.away_score);
      }
    }

    const totalGroups = Object.keys(groups).length;
    const totalTeamsInGroups = Object.values(groups).reduce(
      (sum, rows) => sum + rows.length,
      0
    );

    return {
      groups,
      summary: {
        totalGroups,
        totalTeamsInGroups,
        totalMatches: groupMatches.length,
        completedMatches,
        liveMatches,
        totalGoals,
      },
    };
  }
}

export const standingsService = new StandingsService();
