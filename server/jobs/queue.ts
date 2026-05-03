import { and, eq, lte } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import { jobs } from '../../shared/db/schema';
import type { JobKind } from '../../shared/jobs';
import { JOB_KINDS } from '../../shared/jobs';
import { RateLimited } from '../spotify/client';
import { HANDLERS } from './handlers';
import { isImportComplete, maybeEmitDone } from './progress';
import { enqueueArtistHydration } from './hydration';

export type Job = typeof jobs.$inferSelect;

const MAX_ATTEMPTS = 5;
const POLL_MS = 100;

export function enqueue(opts: {
  userId: number;
  kind: JobKind;
  payload: unknown;
  scheduledAt?: Date;
}): Job {
  return db
    .insert(jobs)
    .values({
      user_id: opts.userId,
      kind: opts.kind,
      payload: opts.payload as never,
      scheduled_at: opts.scheduledAt ?? new Date(),
    })
    .returning()
    .get();
}

export function claimNext(kind: JobKind): Job | null {
  return (
    db.transaction(tx => {
      const row = tx
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.kind, kind),
            eq(jobs.status, 'pending'),
            lte(jobs.scheduled_at, new Date()),
          ),
        )
        .orderBy(jobs.id)
        .limit(1)
        .get();
      if (!row) return null;
      const claimedAt = new Date();
      tx.update(jobs)
        .set({ status: 'running', claimed_at: claimedAt, attempts: row.attempts + 1 })
        .where(eq(jobs.id, row.id))
        .run();
      return {
        ...row,
        status: 'running',
        attempts: row.attempts + 1,
        claimed_at: claimedAt,
      };
    }) ?? null
  );
}

export function startWorkers(): void {
  // Restart-safety: anything still 'running' was orphaned by a process restart.
  db.update(jobs).set({ status: 'pending', claimed_at: null }).where(eq(jobs.status, 'running')).run();

  for (const kind of JOB_KINDS) {
    setInterval(() => {
      void runOnce(kind);
    }, POLL_MS);
  }
}

async function runOnce(kind: JobKind): Promise<void> {
  const job = claimNext(kind);
  if (!job) return;
  try {
    await HANDLERS[kind](job);
    db.update(jobs).set({ status: 'done' }).where(eq(jobs.id, job.id)).run();
    if (kind !== 'import-orchestrator' && isImportComplete(job.user_id)) {
      // Importer is quiet — kick off (or finish) genre hydration before
      // emitting done. Guard against re-firing from inside a hydration job.
      if (kind !== 'hydrate-artist') enqueueArtistHydration(job.user_id);
      maybeEmitDone(job.user_id, true);
    }
  } catch (e) {
    const isRate = e instanceof RateLimited;
    const wait = isRate ? e.seconds * 1000 : Math.min(60_000, 2 ** job.attempts * 1000);
    const failed = !isRate && job.attempts >= MAX_ATTEMPTS;
    const errMsg = e instanceof Error ? e.message : String(e);
    db.update(jobs)
      .set({
        status: failed ? 'failed' : 'pending',
        claimed_at: null,
        scheduled_at: new Date(Date.now() + wait),
        last_error: errMsg,
      })
      .where(eq(jobs.id, job.id))
      .run();
    if (failed && kind === 'import-orchestrator') {
      maybeEmitDone(job.user_id, false, errMsg);
    }
  }
}
