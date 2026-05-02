import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import { users, oauth_tokens } from '../../shared/db/schema';
import { genCodeVerifier, genState, buildAuthorizeUrl } from './pkce';
import { exchangeCodeForToken } from './tokens';

const PORT = Number(process.env.PORT ?? 3000);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/api/auth/callback`;
const POST_LOGIN_REDIRECT =
  process.env.NODE_ENV === 'production' ? '/' : 'http://127.0.0.1:5173/';

type SpotifyMe = { id: string; display_name?: string };

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get('/api/auth/login', async (req, reply) => {
    const verifier = genCodeVerifier();
    const state = genState();
    req.session.set('pkce_verifier', verifier);
    req.session.set('pkce_state', state);
    const url = buildAuthorizeUrl({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      verifier,
      state,
      redirectUri: REDIRECT_URI,
    });
    return reply.redirect(url, 302);
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/api/auth/callback',
    async (req, reply) => {
      const { code, state, error } = req.query;
      if (error) {
        return reply.code(400).send({ error: `spotify error: ${error}` });
      }
      const expectedState = req.session.get('pkce_state');
      const verifier = req.session.get('pkce_verifier');
      req.session.set('pkce_verifier', undefined);
      req.session.set('pkce_state', undefined);
      if (!code || !state || !verifier || state !== expectedState) {
        return reply.code(400).send({ error: 'invalid auth callback' });
      }

      const tokens = await exchangeCodeForToken(code, verifier, REDIRECT_URI);
      const meRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!meRes.ok) {
        return reply.code(502).send({ error: `spotify /me failed: ${meRes.status}` });
      }
      const me = (await meRes.json()) as SpotifyMe;

      const existing = db.select().from(users).where(eq(users.spotify_id, me.id)).get();
      let userId: number;
      if (existing) {
        db.update(users)
          .set({ display_name: me.display_name ?? null })
          .where(eq(users.id, existing.id))
          .run();
        userId = existing.id;
      } else {
        const inserted = db
          .insert(users)
          .values({ spotify_id: me.id, display_name: me.display_name ?? null })
          .returning()
          .get();
        userId = inserted.id;
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      db.insert(oauth_tokens)
        .values({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
        })
        .onConflictDoUpdate({
          target: oauth_tokens.user_id,
          set: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt,
          },
        })
        .run();

      req.session.set('user_id', userId);
      return reply.redirect(POST_LOGIN_REDIRECT, 302);
    },
  );

  app.post('/api/auth/logout', async (req, reply) => {
    req.session.delete();
    return reply.send({ ok: true });
  });

  app.get('/api/me', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
      req.session.delete();
      return reply.code(401).send({ error: 'unauthorized' });
    }
    return reply.send({
      id: user.id,
      spotify_id: user.spotify_id,
      display_name: user.display_name,
    });
  });
}
