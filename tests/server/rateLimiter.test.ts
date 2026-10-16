import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { rateLimiter, _resetRateLimiter } from '../../srv/src/middleware/rateLimiter.ts';

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    _resetRateLimiter();
  });

  test('should allow requests within limit and set response headers', () => {
    const limiter = rateLimiter(60000, 5);
    const headers: Record<string, any> = {};

    const req: any = { ip: '192.168.1.1', path: '/api/tournaments', method: 'GET' };
    const res: any = {
      setHeader: (k: string, v: any) => {
        headers[k] = v;
      },
      status: () => res,
      json: () => res,
    };

    let nextCalled = false;
    limiter(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(headers['X-RateLimit-Limit'], 5);
    assert.strictEqual(headers['X-RateLimit-Remaining'], 4);
  });

  test('should block and return 429 when max requests exceeded', () => {
    const limiter = rateLimiter(60000, 2);
    let statusCode = 200;
    let jsonBody: any = null;

    const createReq = () => ({ ip: '10.0.0.5', path: '/api/tournaments', method: 'GET' });
    const createRes = () => ({
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            jsonBody = body;
          },
        };
      },
    });

    // 1st request
    limiter(createReq() as any, createRes() as any, () => {});
    // 2nd request
    limiter(createReq() as any, createRes() as any, () => {});
    // 3rd request (should exceed)
    let nextCalled = false;
    limiter(createReq() as any, createRes() as any, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'Next should not be called when rate limit exceeded');
    assert.strictEqual(statusCode, 429);
    assert.strictEqual(jsonBody?.error?.code, 'RATE_LIMIT_EXCEEDED');
  });
});
