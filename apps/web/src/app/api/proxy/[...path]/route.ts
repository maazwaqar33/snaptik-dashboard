/**
 * Catch-all API proxy — forwards all /api/proxy/* requests to the admin API
 * backend (HTTP). This lets the HTTPS Vercel frontend avoid mixed-content
 * browser blocks when the backend does not yet have TLS.
 *
 * /api/proxy/auth/login  →  http://BACKEND/api/v1/auth/login
 * /api/proxy/users       →  http://BACKEND/api/v1/users
 * etc.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.ADMIN_API_INTERNAL_URL ?? 'http://16.16.251.27';

// Headers the proxy must not forward to the backend
const HOP_BY_HOP = new Set([
  'host', 'connection', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade',
]);

async function proxy(req: NextRequest): Promise<NextResponse> {
  // Extract the sub-path after /api/proxy/
  const url    = req.nextUrl;
  const subPath = url.pathname.replace(/^\/api\/proxy/, '');
  const target  = `${BACKEND}/api/v1${subPath}${url.search}`;

  // Forward request headers (minus hop-by-hop)
  const reqHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      reqHeaders.set(key, value);
    }
  });

  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, {
    method:  req.method,
    headers: reqHeaders,
    body,
    // @ts-expect-error — node-fetch needs this to avoid caching
    cache: 'no-store',
    duplex: 'half',
  } as RequestInit);

  // Forward response headers (minus hop-by-hop), rewriting cookie paths
  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    resHeaders.set(key, value);
  });

  const resBody = await upstream.arrayBuffer();

  return new NextResponse(resBody, {
    status:  upstream.status,
    headers: resHeaders,
  });
}

export const GET     = proxy;
export const POST    = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
export const HEAD    = proxy;
