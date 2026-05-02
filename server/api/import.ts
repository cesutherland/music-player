import type { FastifyInstance } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import { jobs } from '../../shared/db/schema';
import { enqueue } from '../jobs/queue';
import { computeProgress } from '../jobs/progress';
import { signSocketToken } from '../realtime/auth';

export async function registerImportRoutes(app: FastifyInstance) {
  app.post('/api/import/start', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });

    const existing = db
      .select()
      .from(jobs)
      .where(and(eq(jobs.user_id, userId), eq(jobs.kind, 'import-orchestrator')))
      .orderBy(desc(jobs.id))
      .limit(1)
      .get();

    if (existing && (existing.status === 'pending' || existing.status === 'running')) {
      return reply.send({ ok: true, job_id: existing.id, status: 'in_progress' });
    }

    const j = enqueue({ userId, kind: 'import-orchestrator', payload: {} });
    return reply.send({ ok: true, job_id: j.id, status: 'started' });
  });

  app.get('/api/import/status', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });

    const orch = db
      .select()
      .from(jobs)
      .where(and(eq(jobs.user_id, userId), eq(jobs.kind, 'import-orchestrator')))
      .orderBy(desc(jobs.id))
      .limit(1)
      .get();

    return reply.send({
      job: orch
        ? {
            id: orch.id,
            status: orch.status,
            last_error: orch.last_error,
            created_at: orch.created_at,
          }
        : null,
      progress: computeProgress(userId),
    });
  });

  app.get('/api/socket/token', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    return reply.send({ token: signSocketToken(userId) });
  });
}
