import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import { artists, jobs } from '../../shared/db/schema';
import { enqueue } from './queue';

/**
 * Queue one `hydrate-artist` job for every artist in the library whose
 * genres haven't been fetched yet, skipping any that already have a
 * pending or running hydration job. Returns the number of jobs added.
 *
 * Called from `runOnce` the moment the importer-side work falls quiet,
 * so the orchestrator's `import:done` fires immediately while genre
 * fill-in continues in the background.
 */
export function enqueueArtistHydration(userId: number): number {
  const candidates = db
    .select({ id: artists.id, spotify_id: artists.spotify_id })
    .from(artists)
    .where(isNull(artists.genres_hydrated_at))
    .all();
  if (candidates.length === 0) return 0;

  const queued = db
    .select({ payload: jobs.payload })
    .from(jobs)
    .where(
      and(
        eq(jobs.user_id, userId),
        eq(jobs.kind, 'hydrate-artist'),
        or(eq(jobs.status, 'pending'), eq(jobs.status, 'running')),
      ),
    )
    .all();
  const alreadyQueued = new Set(
    queued
      .map(r => (r.payload as { spotify_id?: string } | null)?.spotify_id)
      .filter((s): s is string => typeof s === 'string'),
  );

  let added = 0;
  for (const a of candidates) {
    if (alreadyQueued.has(a.spotify_id)) continue;
    enqueue({
      userId,
      kind: 'hydrate-artist',
      payload: { spotify_id: a.spotify_id, artist_id: a.id },
    });
    added++;
  }
  return added;
}

/** Total artists known and how many have had genres fetched. */
export function artistHydrationCounts(): { total: number; progress: number } {
  const total = Number(
    db.select({ c: sql<number>`count(*)` }).from(artists).get()?.c ?? 0,
  );
  const progress = Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(artists)
      .where(sql`${artists.genres_hydrated_at} IS NOT NULL`)
      .get()?.c ?? 0,
  );
  return { total, progress };
}
