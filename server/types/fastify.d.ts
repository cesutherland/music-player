import '@fastify/secure-session';

declare module '@fastify/secure-session' {
  interface SessionData {
    user_id?: number;
    pkce_verifier?: string;
    pkce_state?: string;
  }
}
