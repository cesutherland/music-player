import { usePlayback } from './store';

type PlayBody = {
  device_id: string;
  context_uri?: string;
  uris?: string[];
  offset?: { position: number } | { uri: string };
  position_ms?: number;
};

async function postPlay(body: PlayBody): Promise<void> {
  const r = await fetch('/api/playback/play', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`play: ${r.status} ${text}`);
  }
}

function deviceIdOrThrow(): string {
  const id = usePlayback.getState().deviceId;
  if (!id) throw new Error('player not ready');
  return id;
}

export async function playUris(uris: string[], offsetIndex = 0): Promise<void> {
  if (uris.length === 0) return;
  await postPlay({
    device_id: deviceIdOrThrow(),
    uris: uris.slice(0, 200), // hard cap; Spotify allows up to ~750 but smaller is fine
    offset: { position: offsetIndex },
  });
}

export async function playContext(
  contextUri: string,
  offsetUri?: string,
): Promise<void> {
  await postPlay({
    device_id: deviceIdOrThrow(),
    context_uri: contextUri,
    ...(offsetUri ? { offset: { uri: offsetUri } } : {}),
  });
}
