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
        const clean = String(gName || '').trim();
        if (clean && !tableMap[clean]) {
          tableMap[clean] = {};
        }
      }
    }

    // 1. Initialize records for teams
    for (const team of teams) {
      const rawGrp = team.group_name ? String(team.group_name).trim() : '';
      // If definedGroupNames was provided from DB, skip unassigned teams; otherwise fallback to 'Ungrouped'
      if (!rawGrp && Array.isArray(definedGroupNames)) {
        continue;
      }
      const grp = rawGrp || 'Ungrouped';
      if (!tableMap[grp]) {
        tableMap[grp] = {};
      }
      tableMap[grp][String(team.id)] = {
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
      };
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

      const rawGrp = match.group_name ? String(match.group_name).trim() : '';
      // Locate group bucket either by match.group_name or by looking up home_team_id
      let grp = rawGrp;
      if (!grp || !tableMap[grp]) {
        const foundGroup = Object.keys(tableMap).find(
          (gKey) =>
            tableMap[gKey][String(match.home_team_id)] &&
            tableMap[gKey][String(match.away_team_id)]
        );
        if (foundGroup) grp = foundGroup;
      }
      if (!grp || !tableMap[grp]) continue;

      const home = tableMap[grp][String(match.home_team_id)];
      const away = tableMap[grp][String(match.away_team_id)];
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
