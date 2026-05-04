import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { upsertTrack, type SpotifyTrack } from '../upserts';
import { emitProgress } from '../progress';

type AlbumTracksPage = {
  items: SpotifyTrack[];
  next: string | null;
};

type Payload = {
  album_id: number;
  url: string;
};

// Fills in album tracks past the inline page returned by /me/albums.
// Spotify caps the embedded tracks list at 50; longer/multi-disc
// albums need this follow-up pagination or we silently lose tracks.
export async function importAlbumTracksPage(job: Job): Promise<void> {
  const payload = job.payload as Payload;
  const data = await spotifyFetch<AlbumTracksPage>(job.user_id, payload.url);
  for (const t of data.items) {
    if (t.is_local) continue;
    upsertTrack(t, payload.album_id);
  }
  if (data.next) {
    enqueue({
      userId: job.user_id,
      kind: 'import-album-tracks-page',
      payload: {
        album_id: payload.album_id,
        url: data.next.replace('https://api.spotify.com/v1', ''),
      },
    });
  }
  emitProgress(job.user_id);
}
