import path from 'node:path';
import url from 'node:url';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import cookie from '@fastify/cookie';
import secureSession from '@fastify/secure-session';
import { registerAuthRoutes } from './auth/routes';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required (32-byte hex)');
}
if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error('SPOTIFY_CLIENT_ID is required');
}

const app = Fastify({ logger: true });

await app.register(cookie);
await app.register(secureSession, {
  key: Buffer.from(process.env.SESSION_SECRET, 'hex'),
  cookie: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 60 * 60 * 24 * 30,
  },
});

app.get('/api/health', async () => ({ ok: true }));
await registerAuthRoutes(app);

if (process.env.NODE_ENV === 'production') {
  // Compiled layout: dist/server/server/index.js + dist/client/...
  await app.register(staticPlugin, {
    root: path.resolve(__dirname, '../../client'),
    prefix: '/',
  });
}

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: '127.0.0.1' });
