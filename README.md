# altplayer

A self-hosted personal music player backed by Spotify. Brings back the configurable Amarok-style faceted library tree, on top of Spotify's catalog and Web Playback SDK.

## Status

Renovation in progress. Slices 1–7 of the rewrite are landed: PKCE auth, normalized music library, resumable import pipeline (saved tracks, saved albums, playlists, artist genres), faceted sidebar with a configurable group-by chain, virtualized track table, and in-browser playback via the Web Playback SDK.

See `docs/crispy/renovation/` for the design and execution log.

## Prerequisites

- **Node.js 24+** (the dev/build scripts rely on `--env-file=.env`).
- **Spotify Premium**. The Web Playback SDK requires it; free accounts can browse the library but get a "Premium required" banner instead of a player bar.
- **A Spotify app registered** at <https://developer.spotify.com/dashboard>:
  - **Redirect URI:** add `http://127.0.0.1:3000/api/auth/callback` (must be the loopback IP literal — `localhost` is rejected since Spotify's Nov 2025 OAuth migration).
  - **APIs/SDKs:** check **Web API** and **Web Playback SDK** under "Which API/SDKs are you planning to use?".
  - **User Management:** add your own Spotify account email to the app's allowlist (development mode caps at 5 users — fine for self-hosting).

## Quickstart (development)

```bash
# 1. Clone + install
npm install

# 2. Configure
cp .env.example .env
# Edit .env:
#   SPOTIFY_CLIENT_ID=<your app's client id>
#   SESSION_SECRET=<openssl rand -hex 32>

# 3. Initialize the database
npm run migrate

# 4. Run it
npm run dev
```

Open <http://127.0.0.1:5173>. Click **Connect Spotify**, complete the OAuth flow, then **Start import**. The first import walks your saved tracks, saved albums, playlists, and per-artist genres — typically a few minutes for a few thousand tracks.

Once the import is done the app switches to the Layout view: faceted sidebar on the left, track table in the middle, player bar at the bottom. Single-click a track to play it; double-click to play it plus everything below it in the visible list.

## Quickstart (Docker)

```bash
cp .env.example .env
# Fill in SPOTIFY_CLIENT_ID and SESSION_SECRET.

docker compose up -d
```

The container exposes `127.0.0.1:3000` and persists the SQLite database to `./data/altplayer.sqlite`. Browse to <http://127.0.0.1:3000>.

## Environment variables

| Var | Required | Default | Notes |
|---|---|---|---|
| `SPOTIFY_CLIENT_ID` | yes | — | Client ID of your Spotify app. |
| `SESSION_SECRET` | yes | — | 32-byte hex string (`openssl rand -hex 32`). Used for the secure session cookie. |
| `PORT` | no | `3000` | Server port. The Spotify redirect URI must match. |
| `DB_PATH` | no | `./altplayer.sqlite` | SQLite file path. |
| `NODE_ENV` | no | unset (dev) | Set to `production` for the built bundle. |

## Workflows

**Re-import.** Click "Re-import" in the header. The orchestrator re-walks Spotify; playlists with unchanged `snapshot_id` are skipped, so this is much faster than the first import.

**Reset library.** `npm run reset:library` clears all imported data while keeping your login. Useful when iterating on the schema.

**Reconfigure the facet chain.** Click `edit` next to the chain label in the sidebar. Pick 1–3 fields from the dropdowns, or click a preset. The chain is saved per-user.

## Common issues

**OAuth callback fails / "redirect URI mismatch".** The redirect URI in the Spotify dashboard must be exactly `http://127.0.0.1:3000/api/auth/callback`. Not `localhost`, not `0.0.0.0`, not without `/api/auth`.

**"Premium required" banner under the player.** Either your Spotify account isn't Premium, or the consent flow didn't grant the `streaming` scope. Try logging out and back in; check that the consent screen mentions "Stream and control Spotify on your other devices".

**Player bar appears but tracks won't play / "Device not found".** The Web Playback SDK reports a local device id that doesn't always match the id Spotify Connect registers under. The client resolves the real id by name via `/me/player/devices` after the SDK is ready — if that lookup fails, you'll see "Device registered locally but not visible to Spotify Connect" in the player bar. Most common cause is your Spotify app on the dashboard not having **Web Playback SDK** ticked.

**Genre chain shows nothing initially.** Artist genres hydrate after the main import via per-artist `GET /artists/{id}` calls (Spotify removed the batch artist endpoint in Feb 2026). Watch the "Artist genres" bar fill in over the few minutes following import — once a genre count goes above 0 it'll show up in the chain.

**Imports look "complete" while tracks are still appearing in the background.** Known bug, tracked at `docs/crispy/import-progress-bug/`. The progress bars count user-side links rather than track-row population, and `import:done` fires too early in some paths. Fix is queued.

## Layout

```
client/                  React 19 + Vite + Tailwind v4
  playback/              Web Playback SDK init + Zustand store
  store/                 UI Zustand store (chain, expansion, selection)
  Layout.tsx             3-pane shell
  Sidebar.tsx            ChainEditor + Search + virtualized Tree
  Tracks.tsx             virtualized track table
  Player.tsx             bottom bar
server/                  Fastify 5 + Drizzle + better-sqlite3
  api/                   Fastify route handlers
  auth/                  PKCE flow + token refresh
  facet/                 SQL builder for the configurable group-by tree
  jobs/                  Resumable in-process job queue + handlers
  realtime/              socket.io setup + signed-token handshake
  spotify/               Single fetch wrapper with refresh + 429 backoff
shared/
  db/                    Drizzle schema + connection
  facets.ts              FacetField/Chain/Node types + presets
  jobs.ts                JobKind/Status/ImportProgress types
migrations/              drizzle-kit migrations (5 so far)
docs/crispy/             CRISPY workflow artifacts (design, plan, log)
```

## Security notes

This is a single-user, self-hosted app; the threat model assumes you control the host. In particular: Spotify access and refresh tokens are stored in plaintext in `altplayer.sqlite`. Anyone with read access to that file can resurrect a Spotify session indefinitely, so keep file permissions and backups scoped accordingly.

## License

Personal project; not currently licensed for redistribution. Open an issue if you want to fork.
