/**
 * App-wide constants — single source of truth for URLs and config strings.
 * NEVER hardcode beautybilen.com anywhere else in the frontend source.
 */
export const APP = {
  name:        'SnapTik Admin',
  frontendUrl: process.env.NEXT_PUBLIC_APP_URL  ?? 'https://admin.beautybilen.com',
  apiUrl:      process.env.NEXT_PUBLIC_API_URL  ?? 'https://admin-api.beautybilen.com/api/v1',
} as const;
