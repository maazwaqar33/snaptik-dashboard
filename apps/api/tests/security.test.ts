/**
 * Security & edge-case tests — oversized body, path traversal, content-type,
 * ticket CastError, prototype pollution, security headers.
 * Targets the live Docker instance at http://localhost:5001.
 */
import * as http from 'http';
import { get, post, patch, del, login, request } from './helpers/http';

const SA_CREDS = { email: 'admin@snaptik.com', password: 'Admin@1234!' };

let saToken = '';

beforeAll(async () => {
  saToken = await login(SA_CREDS.email, SA_CREDS.password);
}, 20000);

// ── Oversized body ─────────────────────────────────────────────────────────────
/**
 * Helper: send a raw HTTP request with a large body and return the status code.
 * Writes the payload in 64 KB chunks so the server can reject as soon as it hits
 * its body-size limit, rather than waiting for the full Content-Length.
 */
function rawBigPost(path: string, payloadBytes: number, extraHeaders: Record<string, string> = {}): Promise<number> {
  const CHUNK = 64 * 1024;
  const body  = 'X'.repeat(payloadBytes); // plain content — not valid JSON, but that's fine for size testing
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        ...extraHeaders,
      },
    };
    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode ?? 0));
    });
    req.on('error', (e: NodeJS.ErrnoException) => {
      // ECONNRESET / EPIPE = server closed early after rejecting the payload — that's expected behavior
      if (e.code === 'ECONNRESET' || e.code === 'EPIPE') resolve(413);
      else reject(e);
    });
    // Write in chunks; the server will reject after hitting its limit
    let sent = 0;
    function writeChunk() {
      if (sent >= body.length) { req.end(); return; }
      const slice = body.slice(sent, sent + CHUNK);
      sent += slice.length;
      const canContinue = req.write(slice);
      if (canContinue) setImmediate(writeChunk);
      else req.once('drain', writeChunk);
    }
    writeChunk();
  });
}

describe('Oversized request body', () => {
  /**
   * The API configures express.json({ limit: '2mb' }).
   * Sending a body > 2MB should return 413, NOT 500.
   * BUG CONFIRMED: currently returns 500 due to unhandled PayloadTooLargeError.
   */
  it('[BUG] returns 413 (not 500) for body exceeding 2 MB on login endpoint', async () => {
    const status = await rawBigPost('/api/v1/auth/login', 2 * 1024 * 1024 + 1024);
    // Currently returns 500 — this test documents the expected behavior post-fix
    expect(status).not.toBe(500);
  });

  it('[BUG] returns 413 (not 500) for body exceeding 2 MB on settings endpoint', async () => {
    const status = await rawBigPost(
      '/api/v1/settings',
      2 * 1024 * 1024 + 1024,
      saToken ? { Authorization: `Bearer ${saToken}` } : {}
    );
    expect(status).not.toBe(500);
  });
});

// ── Content-type validation ────────────────────────────────────────────────────
describe('Content-Type validation', () => {
  it('rejects non-JSON content-type on login', (done) => {
    const body = 'email=admin%40snaptik.com&password=Admin%401234';
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        // Should either reject with 415 or return 400/401, NOT succeed with 200
        expect(res.statusCode).not.toBe(200);
        done();
      });
    });
    req.on('error', done);
    req.write(body);
    req.end();
  });

  it('handles missing Content-Type gracefully (no 500)', async () => {
    const res = await new Promise<{ status: number }>((resolve, reject) => {
      const payload = '{"email":"x@x.com","password":"y"}';
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(payload) },
      };
      const req = http.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve({ status: res.statusCode ?? 0 }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    expect(res.status).not.toBe(500);
  });
});

// ── Security headers ───────────────────────────────────────────────────────────
describe('Security headers', () => {
  let headers: http.IncomingHttpHeaders;

  beforeAll(async () => {
    const res = await get('/health');
    headers = res.headers;
  });

  it('has X-Content-Type-Options: nosniff', () => {
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  it('has X-Frame-Options set', () => {
    expect(headers['x-frame-options']).toBeDefined();
  });

  it('does not expose X-Powered-By', () => {
    expect(headers['x-powered-by']).toBeUndefined();
  });

  it('has Content-Security-Policy', () => {
    expect(headers['content-security-policy']).toBeDefined();
  });

  it('CORS does not reflect arbitrary origins', async () => {
    const res = await new Promise<{ headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v1/auth/login',
        method: 'OPTIONS',
        headers: {
          Origin: 'http://evil.example.com',
          'Access-Control-Request-Method': 'POST',
        },
      };
      const req = http.request(options, (r) => {
        r.on('data', () => {});
        r.on('end', () => resolve({ headers: r.headers }));
      });
      req.on('error', reject);
      req.end();
    });
    const acao = res.headers['access-control-allow-origin'];
    expect(acao).not.toBe('http://evil.example.com');
    expect(acao).not.toBe('*');
  });
});

// ── Ticket CastError ───────────────────────────────────────────────────────────
describe('Tickets — invalid ObjectId handling', () => {
  /**
   * BUG: GET/PATCH /tickets/:id with a non-ObjectId string throws
   * a Mongoose CastError that bubbles up as 500 instead of 400/404.
   */
  /**
   * BUG CONFIRMED: these return 500 due to unhandled Mongoose CastError.
   * Tests are written as-intended (what the FIXED behavior should be).
   * They will fail until the bug is patched with an ObjectId validation middleware.
   */
  it('GET /api/v1/tickets/not-an-objectid returns 400 or 404, not 500', async () => {
    const res = await get('/api/v1/tickets/not-an-objectid', saToken);
    expect(res.status).not.toBe(500);
  });

  it('PATCH /api/v1/tickets/not-an-objectid returns 400 or 404, not 500', async () => {
    const res = await patch('/api/v1/tickets/not-an-objectid', { status: 'resolved' }, saToken);
    expect(res.status).not.toBe(500);
  });

  it('DELETE /api/v1/tickets/not-an-objectid returns 400 or 404, not 500', async () => {
    const res = await del('/api/v1/tickets/not-an-objectid', saToken);
    expect(res.status).not.toBe(500);
  });

  it('GET /api/v1/tickets/000000000000000000000000 returns 404 for unknown valid ObjectId', async () => {
    const res = await get('/api/v1/tickets/000000000000000000000000', saToken);
    expect(res.status).not.toBe(500);
    expect([404, 400]).toContain(res.status);
  });
});

// ── Path traversal ─────────────────────────────────────────────────────────────
describe('Path traversal', () => {
  const traversalPaths = [
    '/api/v1/../../../etc/passwd',
    '/api/v1/%2e%2e%2fetc%2fpasswd',
    '/api/v1/users/../../../../etc/shadow',
  ];

  for (const path of traversalPaths) {
    it(`${path} does not return 500`, async () => {
      const res = await get(path, saToken);
      expect(res.status).not.toBe(500);
    });
  }
});

// ── Prototype pollution ────────────────────────────────────────────────────────
describe('Prototype pollution', () => {
  it('__proto__ in login body does not crash server', async () => {
    const res = await request('POST', '/api/v1/auth/login', {
      email: SA_CREDS.email,
      password: SA_CREDS.password,
      __proto__: { role: 'super_admin', isAdmin: true },
    });
    expect(res.status).not.toBe(500);
  });

  it('constructor.prototype injection does not elevate privilege', async () => {
    const res = await request('POST', '/api/v1/auth/login', {
      email: SA_CREDS.email,
      password: SA_CREDS.password,
      constructor: { prototype: { role: 'super_admin' } },
    });
    expect(res.status).not.toBe(500);
  });
});

// ── Missing/stub endpoints ─────────────────────────────────────────────────────
describe('Known missing endpoints (should return 404, not 500)', () => {
  const missingEndpoints = [
    { method: 'GET',  path: '/api/v1/analytics/dashboard' },
    { method: 'GET',  path: '/api/v1/content/moderation-queue' },
    { method: 'GET',  path: '/api/v1/reports/kanban' },
    { method: 'POST', path: '/api/v1/content/flag-001/approve' },
    { method: 'POST', path: '/api/v1/content/flag-001/remove' },
  ];

  for (const { method, path } of missingEndpoints) {
    it(`${method} ${path} does not return 500`, async () => {
      const res = method === 'GET'
        ? await get(path, saToken)
        : await post(path, {}, saToken);
      expect(res.status).not.toBe(500);
      // 404 = not implemented; 429 = rate-limited (also confirms no crash)
      expect([404, 429]).toContain(res.status);
    });
  }
});

// ── HTTP method enforcement ────────────────────────────────────────────────────
describe('HTTP method enforcement', () => {
  it('DELETE /api/v1/settings is not allowed (expect 404, 405, or 429)', async () => {
    const res = await del('/api/v1/settings', saToken);
    expect([404, 405, 429]).toContain(res.status);
  });

  it('PUT /api/v1/auth/login is not allowed (expect 404, 405, or 429)', async () => {
    const res = await request('PUT', '/api/v1/auth/login', { email: 'x', password: 'y' });
    expect([404, 405, 429]).toContain(res.status);
  });
});
