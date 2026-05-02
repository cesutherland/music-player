import path from 'node:path';
import url from 'node:url';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

app.get('/api/health', async () => ({ ok: true }));

if (process.env.NODE_ENV === 'production') {
  // Compiled layout: dist/server/server/index.js + dist/client/...
  await app.register(staticPlugin, {
    root: path.resolve(__dirname, '../../client'),
    prefix: '/',
  });
}

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: '127.0.0.1' });
