// Wipe imported library data + jobs. Keeps users + oauth_tokens so the
// session survives — re-import via the UI's "Re-import" button.
import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH ?? './altplayer.sqlite';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const before = {
  artists: db.prepare('SELECT count(*) AS c FROM artists').get() as { c: number },
  albums: db.prepare('SELECT count(*) AS c FROM albums').get() as { c: number },
  tracks: db.prepare('SELECT count(*) AS c FROM tracks').get() as { c: number },
  user_saved_tracks: db
    .prepare('SELECT count(*) AS c FROM user_saved_tracks')
    .get() as { c: number },
  jobs: db.prepare('SELECT count(*) AS c FROM jobs').get() as { c: number },
};

db.transaction(() => {
  // FK cascades: artists → {album,track}_artists; albums → tracks → user_saved_tracks/track_artists.
  db.prepare('DELETE FROM artists').run();
  db.prepare('DELETE FROM albums').run();
  db.prepare('DELETE FROM jobs').run();
})();

const fmt = (label: string, n: number) =>
  `  ${label.padEnd(18)} ${String(n).padStart(7)}`;
console.log(`Reset library data in ${dbPath}.`);
console.log('Cleared:');
console.log(fmt('artists', before.artists.c));
console.log(fmt('albums', before.albums.c));
console.log(fmt('tracks', before.tracks.c));
console.log(fmt('user_saved_tracks', before.user_saved_tracks.c));
console.log(fmt('jobs', before.jobs.c));
console.log('Login retained. Click "Re-import" in the UI.');
