import { eq } from 'drizzle-orm';
import { db } from '../../../shared/db/connection';
import { playlists, user_playlists } from '../../../shared/db/schema';
import { spotifyFetch } from '../../spotify/client';
import { enqueue, type Job } from '../queue';
import { emitProgress } from '../progress';

type PlaylistRef = {
  id: string;
  name: string;
  owner: { id: string; display_name?: string };
  snapshot_id: string;
};
type PlaylistsPage = { items: (PlaylistRef | null)[]; next: string | null; total: number };

export async function importPlaylistsPage(job: Job): Promise<void> {
  const payload = (job.payload ?? {}) as { url?: string };
  const path = payload.url ?? '/me/playlists?limit=50';
  const data = await spotifyFetch<PlaylistsPage>(job.user_id, path);
  for (const pl of data.items) {
    if (!pl) continue;
    const existing = db
      .select()
      .from(playlists)
      .where(eq(playlists.spotify_id, pl.id))
      .get();
    let playlistId: number;
    if (existing) {
      db.update(playlists)
        .set({ name: pl.name, owner_id: pl.owner.id })
        .where(eq(playlists.id, existing.id))
        .run();
      playlistId = existing.id;
    } else {
      playlistId = db
        .insert(playlists)
        .values({
          spotify_id: pl.id,
          name: pl.name,
          owner_id: pl.owner.id,
          snapshot_id: null,
        })
        .returning({ id: playlists.id })
        .get().id;
    }
    db.insert(user_playlists)
      .values({ user_id: job.user_id, playlist_id: playlistId })
      .onConflictDoNothing()
      .run();

    if (!existing || existing.snapshot_id !== pl.snapshot_id) {
      enqueue({
        userId: job.user_id,
        kind: 'import-playlist-items-page',
        payload: {
          playlist_id: playlistId,
          playlist_spotify_id: pl.id,
          target_snapshot_id: pl.snapshot_id,
          url: `/playlists/${pl.id}/items?limit=100`,
          offset: 0,
          is_first_page: true,
        },
      });
    }
  }
  if (data.next) {
    enqueue({
      userId: job.user_id,
      kind: 'import-playlists-page',
      payload: { url: data.next.replace('https://api.spotify.com/v1', '') },
    });
  }
  emitProgress(job.user_id);
}
