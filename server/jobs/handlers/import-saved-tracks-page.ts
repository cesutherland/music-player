import { db } from '../../../shared/db/connection';
import { user_saved_tracks } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { upsertTrack, type SpotifyTrack } from '../upserts';
import { emitProgress, maybeEmitDone } from '../progress';

type SavedTracksPage = {
  items: { added_at: string; track: SpotifyTrack | null }[];
  next: string | null;
  total: number;
};

export async function importSavedTracksPage(job: Job): Promise<void> {
  const payload = (job.payload ?? {}) as { url?: string };
  const path = payload.url ?? '/me/tracks?limit=50';
  const data = await spotifyFetch<SavedTracksPage>(job.user_id, path);
  for (const item of data.items) {
    if (!item.track) continue;
    if (item.track.is_local) continue;
    const trackId = upsertTrack(item.track);
    db.insert(user_saved_tracks)
      .values({
        user_id: job.user_id,
        track_id: trackId,
        added_at: new Date(item.added_at),
      })
      .onConflictDoNothing()
      .run();
  }
  if (data.next) {
    enqueue({
      userId: job.user_id,
      kind: 'import-saved-tracks-page',
      payload: { url: data.next.replace('https://api.spotify.com/v1', '') },
    });
    emitProgress(job.user_id);
  } else {
    emitProgress(job.user_id);
    maybeEmitDone(job.user_id, true);
  }
}
