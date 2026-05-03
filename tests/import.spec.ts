import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Replace the Spotify client wholesale; every server-side caller will
// see the mock. Hoisted by vitest before any other import in this file.
vi.mock('../server/spotify/client', () => ({
  spotifyFetch: vi.fn(),
  RateLimited: class RateLimited extends Error {
    constructor(public seconds: number) {
      super(`rate limited; retry after ${seconds}s`);
    }
  },
  SpotifyError: class SpotifyError extends Error {
    constructor(public status: number, public body: string) {
      super(`spotify ${status}`);
    }
  },
}));

import { spotifyFetch } from '../server/spotify/client';
import { db, sqlite } from '../shared/db/connection';
import {
  users,
  artists,
  albums,
  tracks,
  playlists,
  user_saved_tracks,
  user_saved_albums,
  user_playlists,
  playlist_tracks,
  jobs,
} from '../shared/db/schema';
import { claimNext, enqueue } from '../server/jobs/queue';
import { HANDLERS } from '../server/jobs/handlers';
import { isImportComplete } from '../server/jobs/progress';
import { enqueueArtistHydration } from '../server/jobs/hydration';
import { JOB_KINDS } from '../shared/jobs';

const mockFetch = vi.mocked(spotifyFetch);

function mkTrack(id: string, name: string, artistIds: string[], albumId: string) {
  return {
    id,
    name,
    disc_number: 1,
    track_number: 1,
    duration_ms: 100_000,
    explicit: false,
    is_local: false,
    type: 'track',
    album: mkAlbum(albumId, artistIds),
    artists: artistIds.map(aid => ({ id: aid, name: `Artist ${aid}` })),
  };
}

function mkAlbum(id: string, artistIds: string[]) {
  return {
    id,
    name: `Album ${id}`,
    album_type: 'album',
    release_date: '2020-01-01',
    release_date_precision: 'day',
    images: [{ url: 'http://example.com/cover.jpg' }],
    artists: artistIds.map(aid => ({ id: aid, name: `Artist ${aid}` })),
  };
}

async function runUntilEmpty(maxIterations = 500): Promise<void> {
  for (let iter = 0; iter < maxIterations; iter++) {
    let any = false;
    for (const kind of JOB_KINDS) {
      const job = claimNext(kind);
      if (!job) continue;
      any = true;
      try {
        await HANDLERS[kind](job);
        db.update(jobs).set({ status: 'done' }).where(eq(jobs.id, job.id)).run();
        if (kind !== 'import-orchestrator' && isImportComplete(job.user_id)) {
          if (kind !== 'hydrate-artist') enqueueArtistHydration(job.user_id);
        }
      } catch (e) {
        db.update(jobs)
          .set({ status: 'failed', last_error: e instanceof Error ? e.message : String(e) })
          .where(eq(jobs.id, job.id))
          .run();
      }
    }
    if (!any) return;
  }
  throw new Error('queue did not drain within maxIterations');
}

describe('import smoke test', () => {
  beforeAll(() => {
    migrate(db, { migrationsFolder: './migrations' });
  });

  beforeEach(() => {
    sqlite.exec(`
      DELETE FROM jobs;
      DELETE FROM playlist_tracks;
      DELETE FROM user_playlists;
      DELETE FROM playlists;
      DELETE FROM user_saved_albums;
      DELETE FROM user_saved_tracks;
      DELETE FROM track_artists;
      DELETE FROM album_artists;
      DELETE FROM tracks;
      DELETE FROM albums;
      DELETE FROM artists;
      DELETE FROM oauth_tokens;
      DELETE FROM users;
    `);
    mockFetch.mockReset();
  });

  test('orchestrator imports tracks, albums, playlists, then hydrates artists', async () => {
    const T1 = mkTrack('t1', 'Track 1', ['a1'], 'al1');
    const T2 = mkTrack('t2', 'Track 2', ['a1'], 'al1');
    const AL1 = mkAlbum('al1', ['a1']);

    mockFetch.mockImplementation(async (_userId, path) => {
      // Totals
      if (path === '/me/tracks?limit=1') return { total: 2 };
      if (path === '/me/albums?limit=1') return { total: 1 };
      if (path === '/me/playlists?limit=1') return { total: 1 };

      // First-page imports
      if (path === '/me/tracks?limit=50') {
        return {
          items: [
            { added_at: '2025-01-01T00:00:00Z', track: T1 },
            { added_at: '2025-01-02T00:00:00Z', track: T2 },
          ],
          next: null,
          total: 2,
        };
      }
      if (path === '/me/albums?limit=50') {
        return {
          items: [
            {
              added_at: '2025-01-03T00:00:00Z',
              album: { ...AL1, tracks: { items: [T1, T2], total: 2 } },
            },
          ],
          next: null,
          total: 1,
        };
      }
      if (path === '/me/playlists?limit=50') {
        return {
          items: [
            {
              id: 'pl1',
              name: 'My Playlist',
              owner: { id: 'u1', display_name: 'Owner' },
              snapshot_id: 'snap1',
            },
          ],
          next: null,
          total: 1,
        };
      }
      if (path === '/playlists/pl1/items?limit=100') {
        return {
          items: [
            { added_at: '2025-01-04T00:00:00Z', is_local: false, item: T1 },
            { added_at: '2025-01-04T00:00:00Z', is_local: false, item: T2 },
          ],
          next: null,
          total: 2,
        };
      }

      // Artist hydration
      if (path === '/artists/a1') {
        return { id: 'a1', name: 'Artist a1', genres: ['rock', 'indie'] };
      }

      throw new Error(`unmocked Spotify path: ${path}`);
    });

    const u = db
      .insert(users)
      .values({ spotify_id: 'u1', display_name: 'Test User' })
      .returning()
      .get();

    enqueue({ userId: u.id, kind: 'import-orchestrator', payload: {} });
    await runUntilEmpty();

    expect(db.select().from(tracks).all()).toHaveLength(2);
    expect(db.select().from(albums).all()).toHaveLength(1);
    expect(db.select().from(artists).all()).toHaveLength(1);
    expect(db.select().from(playlists).all()).toHaveLength(1);

    const savedTracks = db
      .select()
      .from(user_saved_tracks)
      .where(eq(user_saved_tracks.user_id, u.id))
      .all();
    expect(savedTracks).toHaveLength(2);

    expect(
      db
        .select()
        .from(user_saved_albums)
        .where(eq(user_saved_albums.user_id, u.id))
        .all(),
    ).toHaveLength(1);
    expect(
      db
        .select()
        .from(user_playlists)
        .where(eq(user_playlists.user_id, u.id))
        .all(),
    ).toHaveLength(1);
    expect(db.select().from(playlist_tracks).all()).toHaveLength(2);

    const a = db.select().from(artists).get();
    expect(a?.genres).toEqual(['rock', 'indie']);
    expect(a?.genres_hydrated_at).toBeInstanceOf(Date);

    // Playlist's snapshot_id was committed only on the final items page.
    const pl = db.select().from(playlists).get();
    expect(pl?.snapshot_id).toBe('snap1');

    // No job ended up failed.
    const failed = db.select().from(jobs).where(eq(jobs.status, 'failed')).all();
    expect(failed).toHaveLength(0);
  });

  test('re-import skips items-page when playlist snapshot_id is unchanged', async () => {
    const T1 = mkTrack('t1', 'Track 1', ['a1'], 'al1');
    let playlistItemsCalls = 0;

    mockFetch.mockImplementation(async (_userId, path) => {
      if (path === '/me/tracks?limit=1') return { total: 0 };
      if (path === '/me/albums?limit=1') return { total: 0 };
      if (path === '/me/playlists?limit=1') return { total: 1 };
      if (path === '/me/tracks?limit=50') return { items: [], next: null, total: 0 };
      if (path === '/me/albums?limit=50') return { items: [], next: null, total: 0 };
      if (path === '/me/playlists?limit=50') {
        return {
          items: [
            {
              id: 'pl1',
              name: 'Pinned',
              owner: { id: 'u1' },
              snapshot_id: 'snap1',
            },
          ],
          next: null,
          total: 1,
        };
      }
      if (path === '/playlists/pl1/items?limit=100') {
        playlistItemsCalls++;
        return {
          items: [{ added_at: '2025-01-01T00:00:00Z', is_local: false, item: T1 }],
          next: null,
          total: 1,
        };
      }
      if (path === '/artists/a1') return { id: 'a1', name: 'A', genres: [] };
      throw new Error(`unmocked: ${path}`);
    });

    const u = db
      .insert(users)
      .values({ spotify_id: 'u1', display_name: 'U' })
      .returning()
      .get();

    enqueue({ userId: u.id, kind: 'import-orchestrator', payload: {} });
    await runUntilEmpty();
    expect(playlistItemsCalls).toBe(1);

    // Second import with the same snapshot — items endpoint must not be hit.
    enqueue({ userId: u.id, kind: 'import-orchestrator', payload: {} });
    await runUntilEmpty();
    expect(playlistItemsCalls).toBe(1);
  });
});
