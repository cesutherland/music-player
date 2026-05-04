import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { getSocket } from './socket';
import type { ImportProgress } from '../shared/jobs';

type Status = {
  job: { id: number; status: string; last_error: string | null } | null;
  progress: ImportProgress;
};

export function Import() {
  const qc = useQueryClient();
  const status = useQuery<Status>({
    queryKey: ['import', 'status'],
    queryFn: async () => {
      const r = await fetch('/api/import/status', { credentials: 'include' });
      if (!r.ok) throw new Error(`status: ${r.status}`);
      return r.json();
    },
    refetchInterval: 5_000,
  });

  const start = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/import/start', {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) throw new Error(`start: ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import', 'status'] }),
  });

  const [live, setLive] = useState<ImportProgress | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let s: Socket | null = null;
    let cancelled = false;
    void (async () => {
      try {
        s = await getSocket();
        if (cancelled) return;
        s.on('import:progress', (p: ImportProgress) => setLive(p));
        s.on('import:done', () => {
          setDone(true);
          qc.invalidateQueries({ queryKey: ['import', 'status'] });
        });
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
      s?.off('import:progress');
      s?.off('import:done');
    };
  }, [qc]);

  const progress = live ?? status.data?.progress;
  const orch = status.data?.job;
  const running = orch?.status === 'pending' || orch?.status === 'running';
  const completed = orch?.status === 'done';
  const failed = orch?.status === 'failed';

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
      <h2 className="text-2xl font-semibold">Library import</h2>

      {!orch && (
        <p className="text-zinc-400">
          Pull your saved tracks from Spotify into the local library.
        </p>
      )}

      {(!orch || completed || failed) && (
        <button
          onClick={() => start.mutate()}
          disabled={start.isPending}
          className="self-start rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {completed || failed ? 'Re-import' : 'Start import'}
        </button>
      )}

      {progress && (running || completed || done) && <Bars p={progress} />}

      {failed && orch?.last_error && (
        <pre className="whitespace-pre-wrap rounded bg-rose-950/30 p-3 text-xs text-rose-300">
          {orch.last_error}
        </pre>
      )}

      {(done || completed) && (
        <p className="text-emerald-400">Import complete.</p>
      )}
    </section>
  );
}

function Bars({ p }: { p: ImportProgress }) {
  return (
    <div className="space-y-3">
      <Bar label="Tracks" {...p.tracks} />
      <Bar label="Albums" {...p.albums} />
      <Bar label="Playlists" {...p.playlists} />
      <Bar label="Artist genres" {...p.artists} />
    </div>
  );
}

function Bar({
  label,
  total,
  progress,
}: {
  label: string;
  total: number;
  progress: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>
          {progress}/{total || '—'}
          {total > 0 && ` (${pct}%)`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
