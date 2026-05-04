import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_PATH ?? './altplayer.sqlite',
  },
} satisfies Config;
