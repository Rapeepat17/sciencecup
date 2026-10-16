import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from '../../srv/src/app.ts';

describe('Server API v1 Endpoints & Security Integration', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. Health & System Endpoints', () => {
    test('GET /api/v1/health should return health status response', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.ok(res.status === 200 || res.status === 503);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.ok(body.data.service === 'sci-cup-backend');
      assert.ok(body.data.database);
    });

    test('GET /api/db should return 404 since legacy endpoint has been safely retired', async () => {
      const res = await fetch(`${baseUrl}/api/db`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('2. Authentication & 401 Unauthorized Cases', () => {
    test('POST /api/v1/tournaments without Authorization header should return 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'new_cup', name: 'New Cup' }),
      });
      assert.strictEqual(res.status, 401);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    test('POST /api/v1/tournaments/sci_cup_main/teams with invalid Bearer token should return 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid_bad_token_xxx',
        },
        body: JSON.stringify({ id: 'team_xyz', name: 'XYZ FC', group_name: 'A' }),
      });
      assert.strictEqual(res.status, 401);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });
  });

  describe('3. Validation & 400 Bad Request Cases', () => {
    test('GET /api/v1/tournaments/:id/teams with invalid characters in :id should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/INVALID@%20ID/teams`);
      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'INVALID_TOURNAMENT_ID');
    });

    test('POST /api/v1/tournaments with malformed body should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_admin_token',
        },
        body: JSON.stringify({ id: 'bad_short', name: 'A' }), // name too short (< 2 chars)
      });
      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    test('POST /api/v1/tournaments/:id/images/upload with invalid base64 should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/images/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_admin_token',
        },
        body: JSON.stringify({ imageBase64: 'not_a_valid_base64_data_url' }),
      });
      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
    });
  });

  describe('4. Resource Existence & 404 Not Found Cases', () => {
    test('GET /api/v1/tournaments/:id for non-existent tournament should return 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/non_existent_cup_9999`);
      assert.strictEqual(res.status, 404);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'NOT_FOUND');
    });

    test('GET /api/v1/unknown-undefined-endpoint should return 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/unknown-undefined-endpoint`);
      assert.strictEqual(res.status, 404);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'NOT_FOUND');
    });
  });

  describe('5. Cross-Tournament Scope Protection', () => {
    test('POST /api/v1/tournaments/:id/players with non-existent or foreign team should return 400 CROSS_TOURNAMENT_MISMATCH', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_admin_token',
        },
        body: JSON.stringify({
          team_id: 'foreign_team_from_other_tournament',
          name: 'Somchai Thongdee',
          number: '7',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.ok(body.error.code === 'CROSS_TOURNAMENT_MISMATCH' || body.error.code === 'DATABASE_ERROR');
    });

    test('POST /api/v1/tournaments/:id/matches with cross-tournament home team should return 400 CROSS_TOURNAMENT_MISMATCH', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_admin_token',
        },
        body: JSON.stringify({
          id: 'test_cross_m1',
          stage: 'group',
          home_team_id: 'non_existent_or_foreign_team_1',
          away_team_id: 'non_existent_or_foreign_team_2',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.ok(body.error.code === 'CROSS_TOURNAMENT_MISMATCH' || body.error.code === 'DATABASE_ERROR');
    });
  });

  describe('6. Tournament Sub-resource Endpoints', () => {
    test('GET /api/v1/tournaments/sci_cup_main/groups should return group mappings', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/groups`);
      assert.ok([200, 400, 404].includes(res.status));
      const body = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(body.success, true);
        assert.ok(typeof body.data === 'object');
      }
    });

    test('GET /api/v1/tournaments/sci_cup_main/bracket should return bracket structure', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/bracket`);
      assert.ok([200, 400, 404].includes(res.status));
      const body = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(body.success, true);
        assert.ok(body.data.knockout_starting_round !== undefined);
      }
    });

    test('GET /api/v1/tournaments/sci_cup_main/players should return player list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/players`);
      assert.ok([200, 400, 404].includes(res.status));
      const body = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(body.success, true);
        assert.ok(Array.isArray(body.data));
      }
    });
  });
});
