import type { FastifyInstance } from 'fastify';
import { Server as IOServer } from 'socket.io';
import type { ImportProgress } from '../../shared/jobs';
import { verifySocketToken } from './auth';

export type ServerToClient = {
  'import:progress': (p: ImportProgress) => void;
  'import:done': (j: { ok: boolean; error?: string }) => void;
  'playback:state': (s: {
    paused: boolean;
    position_ms: number;
    track_id: string | null;
  }) => void;
};

let io: IOServer | null = null;

declare module 'socket.io' {
  interface SocketData {
    userId: number;
  }
}

export function setupSocketIO(app: FastifyInstance) {
  io = new IOServer(app.server, {
    transports: ['websocket', 'polling'],
    path: '/socket.io',
  });
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    const userId = verifySocketToken(token);
    if (!userId) return next(new Error('unauthorized'));
    socket.data.userId = userId;
    next();
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.data.userId}`);
  });
}

export function emit<E extends keyof ServerToClient>(
  userId: number,
  event: E,
  ...args: Parameters<ServerToClient[E]>
): void {
  io?.to(`user:${userId}`).emit(event, ...args);
}
