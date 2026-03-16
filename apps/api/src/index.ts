import 'dotenv/config';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cookieParser    from 'cookie-parser';
import cors            from 'cors';
import helmet          from 'helmet';
import morgan          from 'morgan';
import rateLimit       from 'express-rate-limit';
import swaggerUi       from 'swagger-ui-express';
import { Error as MongooseError } from 'mongoose';
import { openApiSpec } from './openapi';

import { config, connectDB }  from './config';
import authRoutes             from './routes/auth.routes';
import usersRoutes            from './routes/users.routes';
import contentRoutes          from './routes/content.routes';
import reportsRoutes          from './routes/reports.routes';
import ticketsRoutes          from './routes/tickets.routes';
import analyticsRoutes        from './routes/analytics.routes';
import auditRoutes            from './routes/audit.routes';
import settingsRoutes         from './routes/settings.routes';
import adminsRoutes           from './routes/admins.routes';
import dashboardRoutes        from './routes/dashboard.routes';

const app: Express = express();

// ── Security & parsing ──────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin:      config.corsOrigin,
  credentials: true,
  methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Global rate limit (30 req/min per IP) ───────────────────────────────────
app.use('/api/v1', rateLimit({
  windowMs: 60_000,
  limit:    30,
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => req.path.startsWith('/auth'), // auth routes have their own tighter limit
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/users',     usersRoutes);
app.use('/api/v1/content',   contentRoutes);
app.use('/api/v1/reports',   reportsRoutes);
app.use('/api/v1/tickets',   ticketsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit',     auditRoutes);
app.use('/api/v1/settings',  settingsRoutes);
app.use('/api/v1/admins',    adminsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ── Health check (both paths for convenience) ─────────────────────────────────
const healthHandler = (_req: Request, res: Response) =>
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
app.get('/health',          healthHandler);
app.get('/api/v1/health',   healthHandler);

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'SnapTik Admin API',
    swaggerOptions: { persistAuthorization: true },
  }),
);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  // PayloadTooLarge (express.json limit exceeded) → 413
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }
  // Mongoose CastError (invalid ObjectId in route param) → 400
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`\n🚀 SnapTik Admin API running on http://localhost:${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/health`);
    console.log(`   Env:    ${config.nodeEnv}\n`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

export default app;
