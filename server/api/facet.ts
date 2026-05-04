import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../shared/db/connection';
import { user_facet_chains } from '../../shared/db/schema';
import {
  DEFAULT_CHAIN,
  FACET_FIELDS,
  FACET_PRESETS,
  validateChain,
  type FacetChain,
} from '../../shared/facets';
import { getLevelNodes } from '../facet/build-query';

const facetFieldSchema = z.enum(FACET_FIELDS);
const chainSchema = z.array(facetFieldSchema).min(1).max(3);

function parseChainParam(s: string | undefined): FacetChain {
  if (!s) return DEFAULT_CHAIN;
  const parts = s.split(',').map(p => p.trim()).filter(Boolean);
  if (!validateChain(parts)) {
    throw Object.assign(new Error('invalid chain'), { statusCode: 400 });
  }
  return parts;
}

function parsePathParam(s: string | undefined): string[] {
  if (!s) return [];
  // Each segment is decodeURIComponent'd so keys containing '/' (e.g.
  // user-defined genres) survive the round-trip. Client must encode
  // each segment before joining with '/'.
  return s
    .split('/')
    .filter(p => p !== '')
    .map(decodeURIComponent);
}

export async function registerFacetRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { chain?: string; search?: string } }>(
    '/api/facet/tree',
    async (req, reply) => {
      const userId = req.session.get('user_id');
      if (!userId) return reply.code(401).send({ error: 'unauthorized' });
      const chain = parseChainParam(req.query.chain);
      const nodes = getLevelNodes(userId, chain, [], req.query.search);
      return reply.send({ chain, nodes });
    },
  );

  app.get<{ Querystring: { chain?: string; path?: string; search?: string } }>(
    '/api/facet/children',
    async (req, reply) => {
      const userId = req.session.get('user_id');
      if (!userId) return reply.code(401).send({ error: 'unauthorized' });
      const chain = parseChainParam(req.query.chain);
      const path = parsePathParam(req.query.path);
      const nodes = getLevelNodes(userId, chain, path, req.query.search);
      return reply.send({ chain, path, nodes });
    },
  );

  app.get('/api/facet/chain', async (req, reply) => {
    const userId = req.session.get('user_id');
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const row = db
      .select()
      .from(user_facet_chains)
      .where(eq(user_facet_chains.user_id, userId))
      .get();
    const chain = row && validateChain(row.chain) ? row.chain : DEFAULT_CHAIN;
    return reply.send({ chain, presets: FACET_PRESETS });
  });

  app.put<{ Body: { chain: unknown } }>(
    '/api/facet/chain',
    async (req, reply) => {
      const userId = req.session.get('user_id');
      if (!userId) return reply.code(401).send({ error: 'unauthorized' });
      const parsed = chainSchema.safeParse(req.body?.chain);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid chain', issues: parsed.error.issues });
      }
      db.insert(user_facet_chains)
        .values({ user_id: userId, chain: parsed.data })
        .onConflictDoUpdate({
          target: user_facet_chains.user_id,
          set: { chain: parsed.data },
        })
        .run();
      return reply.send({ chain: parsed.data });
    },
  );
}
