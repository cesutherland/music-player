import { eq } from 'drizzle-orm';
import { db } from '../../../shared/db/connection';
import { playlists, playlist_tracks } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { upsertTrack, type SpotifyTrack } from '../upserts';
import { emitProgress } from '../progress';

type PlaylistItemEntry = {
  added_at: string | null;
  is_local: boolean;
  item: (SpotifyTrack & { type?: string }) | null;
};
type PlaylistItemsPage = {
  items: PlaylistItemEntry[];
  next: string | null;
  total: number;
};

type Payload = {
  playlist_id: number;
  playlist_spotify_id: string;
  target_snapshot_id: string;
  url: string;
  offset: number;
  is_first_page: boolean;
};

export async function importPlaylistItemsPage(job: Job): Promise<void> {
  const payload = job.payload as Payload;

  if (payload.is_first_page) {
    db.delete(playlist_tracks)
      .where(eq(playlist_tracks.playlist_id, payload.playlist_id))
      .run();
  }

  const data = await spotifyFetch<PlaylistItemsPage>(job.user_id, payload.url);
  for (let i = 0; i < data.items.length; i++) {
    const entry = data.items[i];
    if (!entry?.item) continue;
    if (entry.is_local) continue;
    if (entry.item.type && entry.item.type !== 'track') continue;
    const trackId = upsertTrack(entry.item);
    const position = payload.offset + i;
    const addedAt = entry.added_at ? new Date(entry.added_at) : null;
    db.insert(playlist_tracks)
      .values({
        playlist_id: payload.playlist_id,
        track_id: trackId,
        position,
        added_at: addedAt,
      })
      .onConflictDoUpdate({
        target: [playlist_tracks.playlist_id, playlist_tracks.position],
        set: { track_id: trackId, added_at: addedAt },
      })
      .run();
  }

  if (data.next) {
    enqueue({
      userId: job.user_id,
      kind: 'import-playlist-items-page',
      payload: {
        ...payload,
        url: data.next.replace('https://api.spotify.com/v1', ''),
        offset: payload.offset + data.items.length,
        is_first_page: false,
      },
    });
  } else {
    db.update(playlists)
      .set({ snapshot_id: payload.target_snapshot_id })
      .where(eq(playlists.id, payload.playlist_id))
      .run();
  }

  emitProgress(job.user_id);
}
