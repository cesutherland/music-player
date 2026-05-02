import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import { jobs, user_saved_tracks } from '../../shared/db/schema';
import type { ImportProgress } from '../../shared/jobs';
import { emit } from '../realtime/io';

type OrchProgress = {
  totals?: { tracks?: number; albums?: number; playlists?: number };
  done_emitted?: boolean;
};

function latestOrchestrator(userId: number) {
  return db
    .select()
    .from(jobs)
    .where(and(eq(jobs.user_id, userId), eq(jobs.kind, 'import-orchestrator')))
    .orderBy(desc(jobs.id))
    .limit(1)
    .get();
}

export function computeProgress(userId: number): ImportProgress {
  const orch = latestOrchestrator(userId);
  const totals = ((orch?.progress as OrchProgress | null)?.totals ?? {}) as NonNullable<
    OrchProgress['totals']
  >;
  const trackCount = Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(user_saved_tracks)
      .where(eq(user_saved_tracks.user_id, userId))
      .get()?.c ?? 0,
  );
  return {
    tracks: { total: totals.tracks ?? 0, progress: trackCount },
    albums: { total: totals.albums ?? 0, progress: 0 },
    playlists: { total: totals.playlists ?? 0, progress: 0 },
    artists: { total: 0, progress: 0 },
  };
}

export function emitProgress(userId: number): void {
  emit(userId, 'import:progress', computeProgress(userId));
}

export function maybeEmitDone(userId: number, ok: boolean, error?: string): void {
  const orch = latestOrchestrator(userId);
  if (!orch) return;
  const prog = (orch.progress as OrchProgress | null) ?? {};
  if (prog.done_emitted) return;
  db.update(jobs)
    .set({ progress: { ...prog, done_emitted: true } as OrchProgress })
    .where(eq(jobs.id, orch.id))
    .run();
  emit(userId, 'import:done', error ? { ok, error } : { ok });
}
