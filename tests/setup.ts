// Set env BEFORE any server module imports happen — connection.ts opens
// the SQLite handle eagerly and fastify boot validates these vars.
process.env.DB_PATH = ':memory:';
process.env.SESSION_SECRET = '00'.repeat(32);
process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
process.env.NODE_ENV = 'test';
