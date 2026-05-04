import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/connection';
import { oauth_tokens } from '../../shared/db/schema';

const refreshLocks = new Map<number, Promise<string>>();

export async function getValidAccessToken(userId: number): Promise<string> {
  const row = db
    .select()
    .from(oauth_tokens)
    .where(eq(oauth_tokens.user_id, userId))
    .get();
  if (!row) throw new Error(`no oauth token for user ${userId}`);
  if (row.expires_at.getTime() - Date.now() > 30_000) return row.access_token;

  const existing = refreshLocks.get(userId);
  if (existing) return existing;

  const p = (async () => {
    const fresh = await refreshSpotifyToken(row.refresh_token);
    db.update(oauth_tokens)
      .set({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token ?? row.refresh_token,
        expires_at: new Date(Date.now() + fresh.expires_in * 1000),
      })
      .where(eq(oauth_tokens.user_id, userId))
      .run();
    return fresh.access_token;
  })().finally(() => refreshLocks.delete(userId));

  refreshLocks.set(userId, p);
  return p;
}

type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as SpotifyTokenResponse;
}

export async function exchangeCodeForToken(
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<SpotifyTokenResponse & { refresh_token: string }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    code_verifier: verifier,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`code exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as SpotifyTokenResponse;
  if (!json.refresh_token) throw new Error('code exchange missing refresh_token');
  return json as SpotifyTokenResponse & { refresh_token: string };
}
