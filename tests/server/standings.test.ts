import { test, describe } from 'node:test';
import assert from 'node:assert';
import { standingsService } from '../../srv/src/services/standings.service.ts';
import { Team, Match } from '../../srv/src/types/models.types.ts';

describe('Standings Service Business Logic', () => {
  const mockTeams: Team[] = [
    { id: 'team_a', name: 'Alpha FC', group_name: 'Group A', tournament_id: 'tour_1' },
    { id: 'team_b', name: 'Beta FC', group_name: 'Group A', tournament_id: 'tour_1' },
    { id: 'team_c', name: 'Gamma FC', group_name: 'Group A', tournament_id: 'tour_1' },
  ];

  test('should initialize teams with 0 points when no matches played', () => {
    const standings = standingsService.calculateGroupStandings(mockTeams, []);
    assert.ok(standings['Group A']);
    assert.strictEqual(standings['Group A'].length, 3);
    assert.strictEqual(standings['Group A'][0].points, 0);
    assert.strictEqual(standings['Group A'][0].played, 0);
  });

  test('should award 3 points for win and 0 for loss', () => {
    const matches: Match[] = [
      {
        id: 'm1',
        tournament_id: 'tour_1',
        stage: 'group',
        group_name: 'Group A',
        home_team_id: 'team_a',
        away_team_id: 'team_b',
        home_score: 2,
        away_score: 0,
        status: 'COMPLETED',
      },
    ];

    const standings = standingsService.calculateGroupStandings(mockTeams, matches);
    const table = standings['Group A'];

    // Team A: 3 points, GD +2
    const teamA = table.find((r) => r.teamId === 'team_a');
    assert.strictEqual(teamA?.points, 3);
    assert.strictEqual(teamA?.won, 1);
    assert.strictEqual(teamA?.goalDifference, 2);

    // Team B: 0 points, GD -2
    const teamB = table.find((r) => r.teamId === 'team_b');
    assert.strictEqual(teamB?.points, 0);
    assert.strictEqual(teamB?.lost, 1);
    assert.strictEqual(teamB?.goalDifference, -2);

    // Team A should be ranked #1
    assert.strictEqual(table[0].teamId, 'team_a');
  });

  test('should award 1 point each for a draw', () => {
    const matches: Match[] = [
      {
        id: 'm2',
        tournament_id: 'tour_1',
        stage: 'group',
        group_name: 'Group A',
        home_team_id: 'team_a',
        away_team_id: 'team_c',
        home_score: 1,
        away_score: 1,
        status: 'COMPLETED',
      },
    ];

    const standings = standingsService.calculateGroupStandings(mockTeams, matches);
    const table = standings['Group A'];

    const teamA = table.find((r) => r.teamId === 'team_a');
    const teamC = table.find((r) => r.teamId === 'team_c');

    assert.strictEqual(teamA?.points, 1);
    assert.strictEqual(teamA?.drawn, 1);
    assert.strictEqual(teamC?.points, 1);
    assert.strictEqual(teamC?.drawn, 1);
  });
});
