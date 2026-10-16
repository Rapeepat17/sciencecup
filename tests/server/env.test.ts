import { test, describe } from 'node:test';
import assert from 'node:assert';
import { env } from '../../srv/src/config/env.ts';

describe('Environment Configuration Validation', () => {
  test('should load valid environment defaults', () => {
    assert.ok(typeof env.PORT === 'number');
    assert.ok(env.PORT > 0);
    assert.ok(['development', 'production', 'test'].includes(env.NODE_ENV));
    assert.ok(env.RATE_LIMIT_MAX_REQUESTS > 0);
    assert.ok(env.RATE_LIMIT_WINDOW_MS > 0);
  });

  test('should contain Supabase URL and Key string configurations', () => {
    assert.ok(typeof env.SUPABASE_URL === 'string');
    assert.ok(typeof env.SUPABASE_ANON_KEY === 'string');
  });

  test('should never expose service role key to frontend configs', () => {
    // Verifying service role key is isolated to server env
    const clientKeys = Object.keys(process.env).filter((k) => k.startsWith('VITE_'));
    assert.strictEqual(
      clientKeys.some((k) => k.toLowerCase().includes('service_role')),
      false,
      'Service role key must never be prefixed with VITE_'
    );
  });
});
