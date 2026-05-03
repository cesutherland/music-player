import { useSyncExternalStore } from 'react';
import { io as createIO, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let pending: Promise<Socket> | null = null;
let connected = false;
const listeners = new Set<() => void>();

function setConnected(v: boolean) {
  if (v === connected) return;
  connected = v;
  listeners.forEach(l => l());
}

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (pending) return pending;
  pending = (async () => {
    const res = await fetch('/api/socket/token', { credentials: 'include' });
    if (!res.ok) throw new Error(`socket token: ${res.status}`);
    const { token } = (await res.json()) as { token: string };
    const s = createIO({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
    });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));
    socket = s;
    return s;
  })().finally(() => {
    pending = null;
  });
  return pending;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  setConnected(false);
}

export function useSocketConnected(): boolean {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => connected,
    () => false,
  );
}
