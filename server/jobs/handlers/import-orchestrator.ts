import { eq } from 'drizzle-orm';
import { db } from '../../../shared/db/connection';
import { jobs } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { emitProgress } from '../progress';

type Totals = { total: number };

async function safeTotal(userId: number, path: string): Promise<number> {
  try {
    const r = await spotifyFetch<Totals>(userId, path);
    return r.total;
  } catch {
    return 0;
  }
}

export async function importOrchestrator(job: Job): Promise<void> {
  const userId = job.user_id;
  const [tracksTotal, albumsTotal, playlistsTotal] = await Promise.all([
    safeTotal(userId, '/me/tracks?limit=1'),
    safeTotal(userId, '/me/albums?limit=1'),
    safeTotal(userId, '/me/playlists?limit=1'),
  ]);
  db.update(jobs)
    .set({
      progress: {
        totals: {
          tracks: tracksTotal,
          albums: albumsTotal,
          playlists: playlistsTotal,
        },
      },
    })
    .where(eq(jobs.id, job.id))
    .run();
  enqueue({ userId, kind: 'import-saved-tracks-page', payload: {} });
  enqueue({ userId, kind: 'import-saved-albums-page', payload: {} });
  enqueue({ userId, kind: 'import-playlists-page', payload: {} });
  emitProgress(userId);
}
