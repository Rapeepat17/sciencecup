import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from '../../srv/src/app.ts';

describe('Authentication & RBAC Authorization Security Tests', () => {
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

  describe('1. Auth Login & Register Endpoints', () => {
    test('POST /api/v1/auth/login with invalid email/password should return 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrong_password_123',
        }),
      });
      assert.strictEqual(res.status, 401);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    test('POST /api/v1/auth/login with malformed body should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: '123' }), // password < 6 chars
      });
      assert.strictEqual(res.status, 400);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    test('POST /api/v1/auth/login with admin credentials should issue valid session token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@scicup.local',
          password: 'Admin@2026',
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.ok(body.data.accessToken);
      assert.strictEqual(body.data.user.role, 'admin');
    });

    test('GET /api/v1/auth/me with Bearer token should return profile and tournament roles', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: 'Bearer dev_admin_token',
        },
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.role, 'admin');
      assert.ok(Array.isArray(body.data.tournaments));
    });
  });

  describe('2. Unauthenticated Access Protection (401)', () => {
    test('POST /api/v1/tournaments/sci_cup_main/teams without token should return 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 't1', name: 'Team 1', group_name: 'A' }),
      });
      assert.strictEqual(res.status, 401);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    test('DELETE /api/v1/tournaments/sci_cup_main without token should return 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main`, {
        method: 'DELETE',
      });
      assert.strictEqual(res.status, 401);
      const body = (await res.json()) as any;
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });
  });

  describe('3. Insufficient Role Permissions (403 Forbidden)', () => {
    test('User with viewer role attempting to add team should receive 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_viewer_token',
        },
        body: JSON.stringify({ id: 't_unauthorized', name: 'Hacker FC', group_name: 'A' }),
      });
      assert.strictEqual(res.status, 403);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN');
    });

    test('User with viewer role attempting to update match scores should receive 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tournaments/sci_cup_main/matches/m1/score`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_viewer_token',
        },
        body: JSON.stringify({ home_score: 5, away_score: 0 }),
      });
      assert.strictEqual(res.status, 403);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN');
    });
  });

  describe('4. Self-Privilege Escalation Prevention', () => {
    test('Register schema strictly rejects or omits injected role parameter', async () => {
      const { registerSchema } = await import('../../srv/src/schemas/auth.schema.ts');
      const payloadWithInjectedRole: any = {
        email: 'attacker@example.com',
        password: 'password123',
        username: 'attacker',
        role: 'admin', // Injected role attempt
      };

      const parsed: any = registerSchema.parse(payloadWithInjectedRole);
      // The parsed schema must NOT include the injected role field
      assert.strictEqual(parsed.role, undefined, 'Injected role field must be stripped by validation schema');
    });
  });
});
