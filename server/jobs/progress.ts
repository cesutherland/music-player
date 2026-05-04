import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import {
  jobs,
  user_saved_tracks,
  user_saved_albums,
  user_playlists,
} from '../../shared/db/schema';
import type { ImportProgress } from '../../shared/jobs';
import { emit } from '../realtime/io';
import { artistHydrationCounts } from './hydration';

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

function countWhereUser(table: typeof user_saved_tracks | typeof user_saved_albums | typeof user_playlists, userId: number): number {
  return Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(table)
      .where(eq(table.user_id, userId))
      .get()?.c ?? 0,
  );
}

export function computeProgress(userId: number): ImportProgress {
  const orch = latestOrchestrator(userId);
  const totals = ((orch?.progress as OrchProgress | null)?.totals ?? {}) as NonNullable<
    OrchProgress['totals']
  >;
  return {
    tracks: { total: totals.tracks ?? 0, progress: countWhereUser(user_saved_tracks, userId) },
    albums: { total: totals.albums ?? 0, progress: countWhereUser(user_saved_albums, userId) },
    playlists: { total: totals.playlists ?? 0, progress: countWhereUser(user_playlists, userId) },
    artists: artistHydrationCounts(),
  };
}

export function emitProgress(userId: number): void {
  emit(userId, 'import:progress', computeProgress(userId));
}

export function isImportComplete(userId: number): boolean {
  const c = Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.user_id, userId),
          sql`${jobs.kind} != 'import-orchestrator'`,
          sql`${jobs.status} in ('pending', 'running')`,
        ),
      )
      .get()?.c ?? 0,
  );
  return c === 0;
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
