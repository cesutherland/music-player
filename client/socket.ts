import { io as createIO, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let pending: Promise<Socket> | null = null;

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
    });
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
}
