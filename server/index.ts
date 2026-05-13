import path from 'node:path';
import url from 'node:url';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import cookie from '@fastify/cookie';
import secureSession from '@fastify/secure-session';
import { runMigrations } from '../shared/db/connection';
import { registerAuthRoutes } from './auth/routes';
import { registerImportRoutes } from './api/import';
import { registerFacetRoutes } from './api/facet';
import { registerTrackRoutes } from './api/tracks';
import { registerPlaybackRoutes } from './api/playback';
import { setupSocketIO } from './realtime/io';
import { registerRealtimeRoutes } from './realtime/routes';
import { startWorkers } from './jobs/queue';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required (32-byte hex)');
}
if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error('SPOTIFY_CLIENT_ID is required');
}

runMigrations();

const isProd = process.env.NODE_ENV === 'production';
const app = Fastify({
  logger: isProd
    ? true
    : {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname,reqId,req,res,responseTime',
            singleLine: false,
            messageFormat: '{msg}',
          },
        },
      },
});

await app.register(cookie);
await app.register(secureSession, {
  key: Buffer.from(process.env.SESSION_SECRET, 'hex'),
  cookie: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    // Default to secure in production. Override with COOKIE_SECURE=0 if
    // running prod-mode behind plain HTTP (rare; documented escape hatch).
    secure: isProd && process.env.COOKIE_SECURE !== '0',
    maxAge: 60 * 60 * 24 * 30,
  },
});

app.get('/api/health', async () => ({ ok: true }));
await registerAuthRoutes(app);
await registerImportRoutes(app);
await registerFacetRoutes(app);
await registerTrackRoutes(app);
await registerPlaybackRoutes(app);
await registerRealtimeRoutes(app);

if (isProd) {
  // tsx runs source from /app/server/index.ts; client build is at /app/dist/client.
  const clientRoot = path.resolve(__dirname, '../dist/client');
  await app.register(staticPlugin, {
    root: clientRoot,
    prefix: '/',
  });
  // SPA fallback: any non-/api GET that didn't match a static file gets
  // index.html so client-side routing can take over.
  app.setNotFoundHandler((req, reply) => {
    if (req.method !== 'GET' || req.url.startsWith('/api/')) {
      return reply.code(404).send({ error: 'not found' });
    }
    return reply.sendFile('index.html');
  });
}

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
await app.listen({ port, host });

setupSocketIO(app);
startWorkers();
