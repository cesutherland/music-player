import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Splash } from './Splash';
import { Import } from './Import';
import { useMe } from './auth';
import { disconnectSocket } from './socket';

export function App() {
  const me = useMe();
  const qc = useQueryClient();
  const logout = useMutation({
    mutationFn: () =>
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    onSuccess: () => {
      disconnectSocket();
      qc.setQueryData(['me'], null);
      qc.invalidateQueries();
    },
  });

  if (me.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-zinc-500">…</span>
      </main>
    );
  }
  if (!me.data) return <Splash />;

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">altplayer</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">
            {me.data.display_name ?? me.data.spotify_id}
          </span>
          <button
            onClick={() => logout.mutate()}
            className="rounded border border-zinc-700 px-3 py-1 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
          >
            Log out
          </button>
        </div>
      </header>
      <Import />
    </main>
  );
}
