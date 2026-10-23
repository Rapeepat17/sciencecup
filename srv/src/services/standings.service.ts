import { Team, Match, GroupStandingRow } from '../types/models.types.ts';

export class StandingsService {
  calculateGroupStandings(teams: Team[], matches: Match[]): Record<string, GroupStandingRow[]> {
    const tableMap: Record<string, Record<string, GroupStandingRow>> = {};

    // 1. Initialize empty records for all teams
    for (const team of teams) {
      const grp = team.group_name || 'Ungrouped';
      if (!tableMap[grp]) {
        tableMap[grp] = {};
      }
      tableMap[grp][String(team.id)] = {
        teamId: String(team.id),
        teamName: team.name,
        groupName: grp,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    }

    // 2. Process all completed group matches
    for (const match of matches) {
      if (match.stage !== 'group') continue;
      if (match.status !== 'COMPLETED' && match.home_score === null && match.away_score === null) continue;
      if (match.home_score === null || match.away_score === null) continue;

      const grp = match.group_name;
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
      } else if (hScore < aScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        home.points += 1;
        away.drawn += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    // 3. Sort each group: Points DESC, GoalDifference DESC, GoalsFor DESC
    const sortedResult: Record<string, GroupStandingRow[]> = {};
    for (const [grp, teamRows] of Object.entries(tableMap)) {
      sortedResult[grp] = Object.values(teamRows).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    }

    return sortedResult;
  }
}

export const standingsService = new StandingsService();
