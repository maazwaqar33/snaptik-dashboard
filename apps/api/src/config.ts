import 'dotenv/config';
import mongoose from 'mongoose';

export const config = {
  port:             Number(process.env.PORT ?? 5001),
  nodeEnv:          process.env.NODE_ENV ?? 'development',
  mongoUri:         process.env.MONGODB_URI ?? 'mongodb://localhost:27017/snaptik',
  jwtAccessSecret:  process.env.JWT_ACCESS_SECRET  ?? 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES  ?? '15m',
  jwtRefreshExpires:process.env.JWT_REFRESH_EXPIRES ?? '7d',
  cookieSecure:     process.env.COOKIE_SECURE  === 'true',
  cookieSameSite:  (process.env.COOKIE_SAME_SITE ?? 'strict') as 'strict' | 'lax' | 'none',
  corsOrigin:       process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  sesFromEmail:     process.env.SES_FROM_EMAIL ?? 'noreply@snaptik.com',
  awsRegion:        process.env.AWS_REGION     ?? 'eu-north-1',
} as const;

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`[DB] Connected to MongoDB at ${config.mongoUri}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  }
}
