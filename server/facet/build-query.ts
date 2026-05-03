import { sql, type SQL } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import type { FacetChain, FacetField, FacetNode } from '../../shared/facets';

/**
 * Per facet field: how to extend `tracks t` with the joins required to
 * compute this field's bucket key/label, and how to filter tracks at
 * alias `t` to those belonging to a specific bucket key (used to apply
 * ancestor-path constraints when computing child levels).
 */
type Spec = {
  joins: SQL;
  keyExpr: SQL;
  labelExpr: SQL;
  filterByKey: (key: string) => SQL;
};

/**
 * Single materialization of the user's track-id set. Subsequent joins
 * start from `user_tracks ut` rather than scanning every track row and
 * applying a per-row `EXISTS` predicate (the v1 shape, which was
 * untenably slow at library size).
 */
function userTracksCte(userId: number): SQL {
  return sql`WITH user_tracks(track_id) AS (
    SELECT track_id FROM user_saved_tracks WHERE user_id = ${userId}
    UNION
    SELECT t.id FROM tracks t
      JOIN user_saved_albums usa ON usa.album_id = t.album_id
      WHERE usa.user_id = ${userId}
    UNION
    SELECT pt.track_id FROM playlist_tracks pt
      JOIN user_playlists up ON up.playlist_id = pt.playlist_id
      WHERE up.user_id = ${userId}
  )`;
}

const FIELDS: Record<FacetField, Spec> = {
  album_artist: {
    joins: sql`JOIN album_artists aa ON aa.album_id = t.album_id JOIN artists ar ON ar.id = aa.artist_id`,
    keyExpr: sql`ar.id`,
    labelExpr: sql`ar.name`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM album_artists aa2
      WHERE aa2.album_id = t.album_id AND aa2.artist_id = ${Number(key)}
    )`,
  },
  track_artist: {
    joins: sql`JOIN track_artists ta ON ta.track_id = t.id JOIN artists ar ON ar.id = ta.artist_id`,
    keyExpr: sql`ar.id`,
    labelExpr: sql`ar.name`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM track_artists ta2
      WHERE ta2.track_id = t.id AND ta2.artist_id = ${Number(key)}
    )`,
  },
  album: {
    joins: sql`JOIN albums al ON al.id = t.album_id`,
    keyExpr: sql`al.id`,
    labelExpr: sql`al.name`,
    filterByKey: key => sql`t.album_id = ${Number(key)}`,
  },
  playlist: {
    joins: sql`JOIN playlist_tracks pt ON pt.track_id = t.id JOIN playlists pl ON pl.id = pt.playlist_id`,
    keyExpr: sql`pl.id`,
    labelExpr: sql`pl.name`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM playlist_tracks pt2
      WHERE pt2.track_id = t.id AND pt2.playlist_id = ${Number(key)}
    )`,
  },
  genre: {
    joins: sql`JOIN track_artists ta ON ta.track_id = t.id JOIN artists ar ON ar.id = ta.artist_id, json_each(coalesce(ar.genres, '[]')) g`,
    keyExpr: sql`g.value`,
    labelExpr: sql`g.value`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM track_artists ta2
      JOIN artists ar2 ON ar2.id = ta2.artist_id, json_each(coalesce(ar2.genres, '[]')) g2
      WHERE ta2.track_id = t.id AND g2.value = ${key}
    )`,
  },
  year_added: {
    joins: sql`JOIN user_saved_tracks ust ON ust.track_id = t.id`,
    keyExpr: sql`strftime('%Y', ust.added_at, 'unixepoch')`,
    labelExpr: sql`strftime('%Y', ust.added_at, 'unixepoch')`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM user_saved_tracks ust2
      WHERE ust2.track_id = t.id
        AND strftime('%Y', ust2.added_at, 'unixepoch') = ${key}
    )`,
  },
  month_added: {
    joins: sql`JOIN user_saved_tracks ust ON ust.track_id = t.id`,
    keyExpr: sql`strftime('%Y-%m', ust.added_at, 'unixepoch')`,
    labelExpr: sql`strftime('%Y-%m', ust.added_at, 'unixepoch')`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM user_saved_tracks ust2
      WHERE ust2.track_id = t.id
        AND strftime('%Y-%m', ust2.added_at, 'unixepoch') = ${key}
    )`,
  },
  year_released: {
    joins: sql`JOIN albums al ON al.id = t.album_id`,
    keyExpr: sql`substr(al.release_date, 1, 4)`,
    labelExpr: sql`substr(al.release_date, 1, 4)`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM albums al2
      WHERE al2.id = t.album_id AND substr(al2.release_date, 1, 4) = ${key}
    )`,
  },
  decade_released: {
    joins: sql`JOIN albums al ON al.id = t.album_id`,
    keyExpr: sql`substr(al.release_date, 1, 3) || '0s'`,
    labelExpr: sql`substr(al.release_date, 1, 3) || '0s'`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM albums al2
      WHERE al2.id = t.album_id
        AND substr(al2.release_date, 1, 3) || '0s' = ${key}
    )`,
  },
  album_type: {
    joins: sql`JOIN albums al ON al.id = t.album_id`,
    keyExpr: sql`coalesce(al.album_type, 'unknown')`,
    labelExpr: sql`coalesce(al.album_type, 'unknown')`,
    filterByKey: key => sql`EXISTS (
      SELECT 1 FROM albums al2
      WHERE al2.id = t.album_id
        AND coalesce(al2.album_type, 'unknown') = ${key}
    )`,
  },
  explicit: {
    joins: sql``,
    keyExpr: sql`(case when t.explicit = 1 then 'explicit' else 'clean' end)`,
    labelExpr: sql`(case when t.explicit = 1 then 'Explicit' else 'Clean' end)`,
    filterByKey: key =>
      sql`(case when t.explicit = 1 then 'explicit' else 'clean' end) = ${key}`,
  },
};

function buildWhere(
  chain: FacetChain,
  path: string[],
  search?: string,
  searchExpr?: SQL,
): SQL | null {
  const parts: SQL[] = [];
  for (let i = 0; i < path.length && i < chain.length; i++) {
    parts.push(FIELDS[chain[i]].filterByKey(path[i]));
  }
  if (search?.trim() && searchExpr) {
    parts.push(sql`${searchExpr} LIKE ${'%' + search.trim() + '%'}`);
  }
  return parts.length > 0 ? sql.join(parts, sql` AND `) : null;
}

export function getLevelNodes(
  userId: number,
  chain: FacetChain,
  path: string[],
  search?: string,
): FacetNode[] {
  if (path.length >= chain.length) return [];
  const field = chain[path.length];
  const spec = FIELDS[field];
  const where = buildWhere(chain, path, search, spec.labelExpr);

  const rows = db.all<{ key: unknown; label: unknown; count: number }>(sql`
    ${userTracksCte(userId)}
    SELECT
      ${spec.keyExpr} AS key,
      ${spec.labelExpr} AS label,
      count(DISTINCT t.id) AS count
    FROM user_tracks ut
    JOIN tracks t ON t.id = ut.track_id
    ${spec.joins}
    ${where ? sql`WHERE ${where}` : sql``}
    GROUP BY ${spec.keyExpr}
    ORDER BY ${spec.labelExpr} COLLATE NOCASE
  `);

  const isLast = path.length === chain.length - 1;
  return rows
    .filter(r => r.key != null && r.label != null && String(r.label) !== '')
    .map(r => ({
      key: String(r.key),
      label: String(r.label),
      count: Number(r.count),
      has_children: !isLast,
    }));
}

export type LeafTrack = {
  id: number;
  spotify_id: string;
  name: string;
  disc_number: number | null;
  track_number: number | null;
  duration_ms: number | null;
  album_id: number;
  album_name: string;
  album_spotify_id: string;
  album_image_url: string | null;
  artist_names: string;
};

export function getLeafTracks(
  userId: number,
  chain: FacetChain,
  path: string[],
  search?: string,
): LeafTrack[] {
  const where = buildWhere(chain, path, search, sql`t.name`);

  // user_tracks CTE narrows the working set; per-track artist names are
  // aggregated inline to keep this a single round-trip.
  return db.all<LeafTrack>(sql`
    ${userTracksCte(userId)}
    SELECT DISTINCT
      t.id, t.spotify_id, t.name, t.disc_number, t.track_number, t.duration_ms,
      t.album_id,
      al.name AS album_name,
      al.spotify_id AS album_spotify_id,
      al.image_url AS album_image_url,
      (
        SELECT group_concat(ar.name, ', ')
        FROM track_artists ta
        JOIN artists ar ON ar.id = ta.artist_id
        WHERE ta.track_id = t.id
      ) AS artist_names
    FROM user_tracks ut
    JOIN tracks t ON t.id = ut.track_id
    JOIN albums al ON al.id = t.album_id
    ${where ? sql`WHERE ${where}` : sql``}
    ORDER BY al.name COLLATE NOCASE, t.disc_number, t.track_number, t.name COLLATE NOCASE
  `);
}
