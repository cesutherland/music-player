import {
  sqliteTable,
  integer,
  text,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spotify_id: text('spotify_id').notNull().unique(),
  display_name: text('display_name'),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const oauth_tokens = sqliteTable('oauth_tokens', {
  user_id: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spotify_id: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  imported_at: integer('imported_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spotify_id: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  album_type: text('album_type'),
  release_date: text('release_date'),
  release_date_precision: text('release_date_precision'),
  image_url: text('image_url'),
  imported_at: integer('imported_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tracks = sqliteTable('tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spotify_id: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  album_id: integer('album_id')
    .notNull()
    .references(() => albums.id, { onDelete: 'cascade' }),
  disc_number: integer('disc_number'),
  track_number: integer('track_number'),
  duration_ms: integer('duration_ms'),
  explicit: integer('explicit', { mode: 'boolean' }),
  is_local: integer('is_local', { mode: 'boolean' }),
  imported_at: integer('imported_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const album_artists = sqliteTable(
  'album_artists',
  {
    album_id: integer('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
  },
  t => ({ pk: primaryKey({ columns: [t.album_id, t.artist_id] }) }),
);

export const track_artists = sqliteTable(
  'track_artists',
  {
    track_id: integer('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
  },
  t => ({ pk: primaryKey({ columns: [t.track_id, t.artist_id] }) }),
);

export const user_saved_tracks = sqliteTable(
  'user_saved_tracks',
  {
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    track_id: integer('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    added_at: integer('added_at', { mode: 'timestamp' }).notNull(),
  },
  t => ({ pk: primaryKey({ columns: [t.user_id, t.track_id] }) }),
);

export const jobs = sqliteTable(
  'jobs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    progress: text('progress', { mode: 'json' }),
    last_error: text('last_error'),
    created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    scheduled_at: integer('scheduled_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    claimed_at: integer('claimed_at', { mode: 'timestamp' }),
  },
  t => ({
    by_kind_status: index('jobs_kind_status').on(t.kind, t.status, t.scheduled_at),
    by_user: index('jobs_user_id').on(t.user_id),
  }),
);
