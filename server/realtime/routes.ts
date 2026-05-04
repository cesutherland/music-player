import type { FastifyInstance } from 'fastify';
import { signSocketToken } from './auth';

export async function registerRealtimeRoutes(app: FastifyInstance) {
  app.get('/api/socket/token', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    return reply.send({ token: signSocketToken(userId) });
  });
}
