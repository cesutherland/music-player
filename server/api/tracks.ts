import type { FastifyInstance } from 'fastify';
import {
  DEFAULT_CHAIN,
  validateChain,
  type FacetChain,
} from '../../shared/facets';
import { getLeafTracks } from '../facet/build-query';

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
  return s.split('/').filter(p => p !== '');
}

export async function registerTrackRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { chain?: string; path?: string; search?: string } }>(
    '/api/tracks',
    async (req, reply) => {
      const userId = req.session.get('user_id');
      if (!userId) return reply.code(401).send({ error: 'unauthorized' });
      const chain = parseChainParam(req.query.chain);
      const path = parsePathParam(req.query.path);
      const tracks = getLeafTracks(userId, chain, path, req.query.search);
      return reply.send({ tracks });
    },
  );
}
