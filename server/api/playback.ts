import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getValidAccessToken } from '../auth/tokens';
import { spotifyFetch } from '../spotify/client';

type SpotifyDevice = {
  id: string;
  is_active: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
};

async function waitForDevice(
  userId: number,
  deviceId: string,
  log: FastifyBaseLogger,
  attempts = 6,
  delayMs = 300,
): Promise<SpotifyDevice | null> {
  for (let i = 0; i < attempts; i++) {
    const data = await spotifyFetch<{ devices: SpotifyDevice[] }>(
      userId,
      '/me/player/devices',
    );
    const ours = data.devices.find(d => d.id === deviceId);
    if (ours) {
      if (i > 0) log.info({ tries: i + 1 }, 'device appeared');
      return ours;
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

const playSchema = z.object({
  device_id: z.string(),
  context_uri: z.string().optional(),
  uris: z.array(z.string()).optional(),
  offset: z
    .union([z.object({ position: z.number().int().nonnegative() }), z.object({ uri: z.string() })])
    .optional(),
  position_ms: z.number().int().nonnegative().optional(),
});

export async function registerPlaybackRoutes(app: FastifyInstance) {
  app.get('/api/playback/token', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const access_token = await getValidAccessToken(userId);
    return reply.send({ access_token });
  });

  app.get('/api/playback/devices', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const data = await spotifyFetch<{ devices: SpotifyDevice[] }>(
      userId,
      '/me/player/devices',
    );
    return reply.send(data);
  });

  app.post<{ Body: unknown }>('/api/playback/play', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const parsed = playSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid body', issues: parsed.error.issues });
    }
    const { device_id, ...body } = parsed.data;
    const playPath = `/me/player/play?device_id=${encodeURIComponent(device_id)}`;
    const init: RequestInit = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };

    req.log.info({ device_id, body }, 'playback/play');

    // Wait for our device to appear in Spotify's device list. The SDK
    // can return a `ready` event before Spotify's central state has
    // propagated the device, which produces a 404 on the play call.
    const found = await waitForDevice(userId, device_id, req.log);
    if (!found) {
      req.log.warn({ device_id }, 'device never appeared in /me/player/devices');
      return reply.code(503).send({
        error: 'device_not_found',
        message:
          'altplayer device not registered with Spotify. Reload the tab to reinitialize the SDK.',
      });
    }

    // Transfer first (idempotent) so this device is the playback target,
    // then send play with our URIs.
    if (!found.is_active) {
      req.log.info('device inactive — transferring');
      await spotifyFetch(userId, '/me/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [device_id], play: false }),
      });
      // Brief settle window so play picks up the new active device.
      await new Promise(r => setTimeout(r, 250));
    }

    await spotifyFetch(userId, playPath, init);
    return reply.send({ ok: true });
  });

  // Transfer playback to our device — useful when the user already has
  // Spotify open on another device and we want it to come here.
  app.post<{ Body: { device_id?: string; play?: boolean } }>(
    '/api/playback/transfer',
    async (req, reply) => {
      const userId = req.session.get('user_id');
      if (!userId) return reply.code(401).send({ error: 'unauthorized' });
      const { device_id, play = false } = req.body ?? {};
      if (!device_id) return reply.code(400).send({ error: 'device_id required' });
      await spotifyFetch(userId, '/me/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [device_id], play }),
      });
      return reply.send({ ok: true });
    },
  );
}
