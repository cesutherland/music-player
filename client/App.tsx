import { useQuery } from '@tanstack/react-query';
import { Splash } from './Splash';
import { Import } from './Import';
import { Layout } from './Layout';
import { useMe } from './auth';
import type { ImportProgress } from '../shared/jobs';

type ImportStatus = {
  job: { id: number; status: string; last_error: string | null } | null;
  progress: ImportProgress;
};

export function App() {
  const me = useMe();
  const status = useQuery<ImportStatus>({
    queryKey: ['import', 'status'],
    queryFn: async () => {
      const r = await fetch('/api/import/status', { credentials: 'include' });
      if (!r.ok) throw new Error(`status: ${r.status}`);
      return r.json();
    },
    enabled: !!me.data,
    refetchInterval: 5_000,
  });

  if (me.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-zinc-500">…</span>
      </main>
    );
  }
  if (!me.data) return <Splash />;

  const orch = status.data?.job;
  const importing = orch?.status === 'pending' || orch?.status === 'running';
  const neverImported = !orch && !status.isPending;

  if (neverImported || importing) {
    return (
      <main className="min-h-screen">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
          <h1 className="text-lg font-semibold tracking-tight">altplayer</h1>
          <span className="text-sm text-zinc-400">
            {me.data.display_name ?? me.data.spotify_id}
          </span>
        </header>
        <Import />
      </main>
    );
  }

  return <Layout me={me.data} />;
}
