// Wipe imported library data + jobs. Keeps users + oauth_tokens so the
// session survives — re-import via the UI's "Re-import" button.
import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH ?? './altplayer.sqlite';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const count = (t: string) =>
  (db.prepare(`SELECT count(*) AS c FROM ${t}`).get() as { c: number }).c;

const before = {
  artists: count('artists'),
  albums: count('albums'),
  tracks: count('tracks'),
  user_saved_tracks: count('user_saved_tracks'),
  user_saved_albums: count('user_saved_albums'),
  playlists: count('playlists'),
  user_playlists: count('user_playlists'),
  playlist_tracks: count('playlist_tracks'),
  jobs: count('jobs'),
};

db.transaction(() => {
  // FK cascades: artists → {album,track}_artists; albums → tracks →
  // user_saved_tracks/playlist_tracks/track_artists; albums → user_saved_albums;
  // playlists → playlist_tracks/user_playlists. Jobs is independent.
  db.prepare('DELETE FROM artists').run();
  db.prepare('DELETE FROM albums').run();
  db.prepare('DELETE FROM playlists').run();
  db.prepare('DELETE FROM jobs').run();
})();

const fmt = (label: string, n: number) =>
  `  ${label.padEnd(20)} ${String(n).padStart(7)}`;
console.log(`Reset library data in ${dbPath}.`);
console.log('Cleared:');
for (const [k, v] of Object.entries(before)) console.log(fmt(k, v));
console.log('Login retained. Click "Re-import" in the UI.');
