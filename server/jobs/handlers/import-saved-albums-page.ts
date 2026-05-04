import { db } from '../../../shared/db/connection';
import { user_saved_albums } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { upsertAlbum, upsertTrack, type SpotifyTrack } from '../upserts';
import { emitProgress } from '../progress';

type AlbumWithTracks = Parameters<typeof upsertAlbum>[0] & {
  tracks?: { items: SpotifyTrack[]; total: number; next?: string | null };
};
type SavedAlbum = { added_at: string; album: AlbumWithTracks };
type SavedAlbumsPage = { items: SavedAlbum[]; next: string | null; total: number };

export async function importSavedAlbumsPage(job: Job): Promise<void> {
  const payload = (job.payload ?? {}) as { url?: string };
  const path = payload.url ?? '/me/albums?limit=50';
  const data = await spotifyFetch<SavedAlbumsPage>(job.user_id, path);
  for (const item of data.items) {
    if (!item.album) continue;
    const albumId = upsertAlbum(item.album);
    db.insert(user_saved_albums)
      .values({
        user_id: job.user_id,
        album_id: albumId,
        added_at: new Date(item.added_at),
      })
      .onConflictDoNothing()
      .run();
    for (const t of item.album.tracks?.items ?? []) {
      if (t.is_local) continue;
      upsertTrack(t, albumId);
    }
    // Spotify embeds at most ~50 tracks inline; longer albums need a
    // follow-up to /albums/{id}/tracks to pick up the rest.
    const nextTracksUrl = item.album.tracks?.next;
    if (nextTracksUrl) {
      enqueue({
        userId: job.user_id,
        kind: 'import-album-tracks-page',
        payload: {
          album_id: albumId,
          url: nextTracksUrl.replace('https://api.spotify.com/v1', ''),
        },
      });
    }
  }
  if (data.next) {
    enqueue({
      userId: job.user_id,
      kind: 'import-saved-albums-page',
      payload: { url: data.next.replace('https://api.spotify.com/v1', '') },
    });
  }
  emitProgress(job.user_id);
}
