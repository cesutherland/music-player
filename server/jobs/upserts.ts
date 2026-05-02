import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import {
  artists,
  albums,
  tracks,
  album_artists,
  track_artists,
} from '../../shared/db/schema';

type SpotifyArtist = { id: string; name: string };
type SpotifyAlbum = {
  id: string;
  name: string;
  album_type?: string;
  release_date?: string;
  release_date_precision?: string;
  images?: { url: string }[];
  artists: SpotifyArtist[];
};
export type SpotifyTrack = {
  id: string;
  name: string;
  disc_number?: number;
  track_number?: number;
  duration_ms?: number;
  explicit?: boolean;
  is_local?: boolean;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
};

export function upsertArtist(a: SpotifyArtist): number {
  const existing = db
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.spotify_id, a.id))
    .get();
  if (existing) {
    db.update(artists).set({ name: a.name }).where(eq(artists.id, existing.id)).run();
    return existing.id;
  }
  return db
    .insert(artists)
    .values({ spotify_id: a.id, name: a.name })
    .returning({ id: artists.id })
    .get().id;
}

export function upsertAlbum(a: SpotifyAlbum): number {
  const existing = db
    .select({ id: albums.id })
    .from(albums)
    .where(eq(albums.spotify_id, a.id))
    .get();
  let albumId: number;
  const cols = {
    name: a.name,
    album_type: a.album_type ?? null,
    release_date: a.release_date ?? null,
    release_date_precision: a.release_date_precision ?? null,
    image_url: a.images?.[0]?.url ?? null,
  };
  if (existing) {
    db.update(albums).set(cols).where(eq(albums.id, existing.id)).run();
    albumId = existing.id;
  } else {
    albumId = db
      .insert(albums)
      .values({ spotify_id: a.id, ...cols })
      .returning({ id: albums.id })
      .get().id;
  }
  for (const sa of a.artists ?? []) {
    const artistId = upsertArtist(sa);
    db.insert(album_artists)
      .values({ album_id: albumId, artist_id: artistId })
      .onConflictDoNothing()
      .run();
  }
  return albumId;
}

export function upsertTrack(t: SpotifyTrack): number {
  const albumId = upsertAlbum(t.album);
  const existing = db
    .select({ id: tracks.id })
    .from(tracks)
    .where(eq(tracks.spotify_id, t.id))
    .get();
  const cols = {
    name: t.name,
    album_id: albumId,
    disc_number: t.disc_number ?? null,
    track_number: t.track_number ?? null,
    duration_ms: t.duration_ms ?? null,
    explicit: t.explicit ?? null,
    is_local: t.is_local ?? null,
  };
  let trackId: number;
  if (existing) {
    db.update(tracks).set(cols).where(eq(tracks.id, existing.id)).run();
    trackId = existing.id;
  } else {
    trackId = db
      .insert(tracks)
      .values({ spotify_id: t.id, ...cols })
      .returning({ id: tracks.id })
      .get().id;
  }
  for (const ta of t.artists ?? []) {
    const artistId = upsertArtist(ta);
    db.insert(track_artists)
      .values({ track_id: trackId, artist_id: artistId })
      .onConflictDoNothing()
      .run();
  }
  return trackId;
}
