import * as http from 'http';

const BASE = 'http://localhost:5001';

export interface ApiResponse {
  status: number;
  body: unknown;
  headers: http.IncomingHttpHeaders;
}

export function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed: unknown;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode ?? 0, body: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function login(email: string, password: string): Promise<string> {
  const res = await request('POST', '/api/v1/auth/login', { email, password });
  const body = res.body as Record<string, unknown>;
  if (!body.accessToken) throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  return body.accessToken as string;
}

export const get  = (path: string, token?: string) => request('GET',    path, undefined, token);
export const post = (path: string, body: unknown, token?: string) => request('POST',   path, body, token);
export const patch = (path: string, body: unknown, token?: string) => request('PATCH', path, body, token);
export const del  = (path: string, token?: string) => request('DELETE', path, undefined, token);
