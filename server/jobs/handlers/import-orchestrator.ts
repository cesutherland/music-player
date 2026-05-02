import { eq } from 'drizzle-orm';
import { db } from '../../../shared/db/connection';
import { jobs } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { emitProgress } from '../progress';

type Totals = { total: number };

export async function importOrchestrator(job: Job): Promise<void> {
  const userId = job.user_id;
  let trackTotal = 0;
  try {
    const r = await spotifyFetch<Totals>(userId, '/me/tracks?limit=1');
    trackTotal = r.total;
  } catch {
    // Best-effort total — UI will just show 0/0 if we can't fetch it.
  }
  db.update(jobs)
    .set({ progress: { totals: { tracks: trackTotal, albums: 0, playlists: 0 } } })
    .where(eq(jobs.id, job.id))
    .run();
  enqueue({
    userId,
    kind: 'import-saved-tracks-page',
    payload: {},
  });
  emitProgress(userId);
}
