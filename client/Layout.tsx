import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Tracks } from './Tracks';
import { Player } from './Player';
import { disconnectSocket, useSocketConnected } from './socket';
import type { Me } from './auth';

export function Layout({ me }: { me: Me }) {
  const qc = useQueryClient();
  const reimport = useMutation({
    mutationFn: () =>
      fetch('/api/import/start', { method: 'POST', credentials: 'include' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import', 'status'] }),
  });
  const logout = useMutation({
    mutationFn: () =>
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    onSuccess: () => {
      disconnectSocket();
      qc.setQueryData(['me'], null);
      qc.invalidateQueries();
    },
  });

  const socketConnected = useSocketConnected();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2">
        <h1 className="text-lg font-semibold tracking-tight">altplayer</h1>
        <div className="flex items-center gap-3 text-sm">
          {!socketConnected && (
            <span
              className="rounded bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300"
              title="Realtime updates are paused while the WebSocket is offline."
            >
              reconnecting…
            </span>
          )}
          <span className="text-zinc-400">
            {me.display_name ?? me.spotify_id}
          </span>
          <button
            onClick={() => reimport.mutate()}
            disabled={reimport.isPending}
            className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Re-import
          </button>
          <button
            onClick={() => logout.mutate()}
            className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Log out
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Tracks />
        </main>
      </div>
      <Player />
    </div>
  );
}
