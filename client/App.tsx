import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Splash } from './Splash';
import { useMe } from './auth';

export function App() {
  const me = useMe();
  const qc = useQueryClient();
  const logout = useMutation({
    mutationFn: () =>
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    onSuccess: () => qc.setQueryData(['me'], null),
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome, {me.data.display_name ?? me.data.spotify_id}
      </h1>
      <p className="text-zinc-400">Slice 2 wired. Library import comes next.</p>
      <button
        onClick={() => logout.mutate()}
        className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
      >
        Log out
      </button>
    </main>
  );
}
