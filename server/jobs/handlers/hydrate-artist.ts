import { eq } from 'drizzle-orm';
import { db } from '../../../shared/db/connection';
import { artists } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { type Job } from '../queue';
import { emitProgress } from '../progress';

type ArtistResp = { id: string; name: string; genres?: string[] };

export async function hydrateArtist(job: Job): Promise<void> {
  const payload = job.payload as { spotify_id: string };
  const data = await spotifyFetch<ArtistResp>(
    job.user_id,
    `/artists/${payload.spotify_id}`,
  );
  db.update(artists)
    .set({
      name: data.name,
      genres: data.genres ?? [],
      genres_hydrated_at: new Date(),
    })
    .where(eq(artists.spotify_id, payload.spotify_id))
    .run();
  emitProgress(job.user_id);
}
