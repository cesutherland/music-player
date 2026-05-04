import crypto from 'node:crypto';

export const SCOPES = [
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-email',
  'user-read-private',
].join(' ');

const b64url = (b: Buffer) => b.toString('base64url');

export function genCodeVerifier(): string {
  return b64url(crypto.randomBytes(64));
}

export function codeChallenge(verifier: string): string {
  return b64url(crypto.createHash('sha256').update(verifier).digest());
}

export function genState(): string {
  return b64url(crypto.randomBytes(16));
}

export function buildAuthorizeUrl(opts: {
  clientId: string;
  verifier: string;
  state: string;
  redirectUri: string;
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId,
    scope: SCOPES,
    redirect_uri: opts.redirectUri,
    state: opts.state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge(opts.verifier),
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
