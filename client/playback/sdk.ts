import type { SpotifyPlayer } from './types';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';

let scriptLoading: Promise<void> | null = null;
let player: SpotifyPlayer | null = null;
let initPromise: Promise<SpotifyPlayer> | null = null;
// Bumped by destroyPlayer to invalidate any in-flight init. Without
// this, StrictMode's mount → cleanup → mount sequence could let a
// pre-cleanup init's `.then(p => player = p)` clobber the second
// init's player after we'd already nulled out state.
let initGeneration = 0;

function loadSdkScript(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('spotify-sdk');
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    if (existing) return;
    const s = document.createElement('script');
    s.id = 'spotify-sdk';
    s.src = SDK_SRC;
    s.async = true;
    s.onerror = () => reject(new Error('spotify SDK script failed to load'));
    document.body.appendChild(s);
  });
  return scriptLoading;
}

const PLAYER_NAME = 'altplayer';

async function fetchToken(): Promise<string> {
  const r = await fetch('/api/playback/token', { credentials: 'include' });
  if (!r.ok) throw new Error(`playback token: ${r.status}`);
  const { access_token } = (await r.json()) as { access_token: string };
  return access_token;
}

/**
 * The SDK's `ready` event reports a local device id that does NOT
 * always match the id Spotify Connect registers the device under
 * (observed on http://127.0.0.1 origins and reproducible on https as
 * well). Look up our device by name in `/me/player/devices` and return
 * Spotify's id; that's what every subsequent play/transfer call needs.
 *
 * Polls because Connect registration lags the local `ready` event.
 */
async function resolveSpotifyDeviceId(sdkReportedId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const r = await fetch('/api/playback/devices', { credentials: 'include' });
      if (r.ok) {
        const { devices } = (await r.json()) as {
          devices: { id: string; name: string }[];
        };
        const exact = devices.find(d => d.id === sdkReportedId);
        if (exact) return exact.id;
        const byName = devices.find(d => d.name === PLAYER_NAME);
        if (byName) return byName.id;
      }
    } catch (err) {
      console.warn('[playback] devices fetch failed', err);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

export async function getOrInitPlayer(opts: {
  onReady: (deviceId: string) => void;
  onState: (s: import('./types').SdkPlaybackState | null) => void;
  onError: (kind: string, message: string) => void;
}): Promise<SpotifyPlayer> {
  if (player) return player;
  if (initPromise) return initPromise;

  const myGen = ++initGeneration;
  initPromise = (async () => {
    await loadSdkScript();
    if (!window.Spotify) throw new Error('spotify SDK not loaded');
    const p = new window.Spotify.Player({
      name: PLAYER_NAME,
      getOAuthToken: cb => {
        fetchToken().then(cb).catch(err => {
          console.error('[playback] token fetch failed', err);
          opts.onError('authentication_error', String(err));
        });
      },
      volume: 0.5,
    });

    p.addListener('ready', ({ device_id }) => {
      console.info('[playback] ready', { device_id });
      void resolveSpotifyDeviceId(device_id).then(resolved => {
        if (resolved) {
          if (resolved !== device_id) {
            console.info('[playback] resolved Connect device id', {
              sdk: device_id,
              connect: resolved,
            });
          }
          opts.onReady(resolved);
        } else {
          console.error('[playback] device never appeared in /me/player/devices');
          opts.onError(
            'initialization_error',
            'Device registered locally but not visible to Spotify Connect.',
          );
        }
      });
    });
    p.addListener('not_ready', ({ device_id }) => {
      console.warn('[playback] not_ready', { device_id });
      opts.onReady('');
    });
    p.addListener('player_state_changed', s => opts.onState(s));
    p.addListener('autoplay_failed', () => console.warn('[playback] autoplay_failed'));
    for (const ev of [
      'initialization_error',
      'authentication_error',
      'account_error',
      'playback_error',
    ] as const) {
      p.addListener(ev, e => {
        console.error(`[playback] ${ev}`, e);
        opts.onError(ev, e.message);
      });
    }

    const ok = await p.connect();
    if (!ok) throw new Error('Spotify.Player.connect() returned false');
    if (myGen !== initGeneration) {
      // destroyPlayer fired during init — drop this player on the floor
      // rather than letting it overwrite whatever's current.
      try { p.disconnect(); } catch { /* ignore */ }
      throw new Error('player init superseded by destroyPlayer');
    }
    player = p;
    return p;
  })().catch(err => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

export function destroyPlayer(): void {
  initGeneration++;
  if (player) {
    try {
      player.disconnect();
    } catch {
      // ignore
    }
  }
  player = null;
  initPromise = null;
}
