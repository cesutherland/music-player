import { getValidAccessToken } from '../auth/tokens';

export class RateLimited extends Error {
  constructor(public seconds: number) {
    super(`spotify rate limited; retry after ${seconds}s`);
    this.name = 'RateLimited';
  }
}

export class SpotifyError extends Error {
  constructor(public status: number, public body: string) {
    super(`spotify ${status}: ${body}`);
    this.name = 'SpotifyError';
  }
}

export async function spotifyFetch<T = unknown>(
  userId: number,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let token = await getValidAccessToken(userId);
  const url = path.startsWith('http')
    ? path
    : `https://api.spotify.com/v1${path}`;
  const baseHeaders = { ...(init.headers as Record<string, string> | undefined) };

  let res = await fetch(url, {
    ...init,
    headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    token = await getValidAccessToken(userId);
    res = await fetch(url, {
      ...init,
      headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
    });
  }

  if (res.status === 429) {
    const wait = Number(res.headers.get('Retry-After') ?? '1');
    throw new RateLimited(wait);
  }

  if (!res.ok) {
    throw new SpotifyError(res.status, await res.text());
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
