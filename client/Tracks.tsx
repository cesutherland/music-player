import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FacetChain } from '../shared/facets';
import { useUi } from './store/ui';
import { playUris } from './playback/play';
import { usePlayback } from './playback/store';

type Track = {
  id: number;
  spotify_id: string;
  name: string;
  disc_number: number | null;
  track_number: number | null;
  duration_ms: number | null;
  album_id: number;
  album_name: string;
  album_spotify_id: string;
  album_image_url: string | null;
  artist_names: string | null;
};

function fmtDuration(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fetchTracks(
  chain: FacetChain,
  path: string[],
  search: string,
): Promise<{ tracks: Track[] }> {
  const params = new URLSearchParams();
  params.set('chain', chain.join(','));
  if (path.length > 0) params.set('path', path.join('/'));
  if (search.trim()) params.set('search', search.trim());
  return fetch(`/api/tracks?${params}`, { credentials: 'include' }).then(r => {
    if (!r.ok) throw new Error(`tracks: ${r.status}`);
    return r.json();
  });
}

export function Tracks() {
  const { chain, selection, search } = useUi();

  const path = selection ?? [];
  const q = useQuery({
    queryKey: ['tracks', chain.join('|'), path.join('/'), search],
    queryFn: () => fetchTracks(chain, path, search),
    staleTime: 30_000,
    enabled: selection !== null,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const tracks = q.data?.tracks ?? [];
  const ready = usePlayback(s => s.ready);
  const currentUri = usePlayback(s => s.current?.uri ?? null);
  const virt = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 12,
  });

  const allUris = tracks.map(t => `spotify:track:${t.spotify_id}`);

  function playOne(idx: number) {
    if (!ready) return;
    void playUris([allUris[idx]]);
  }
  function playAllFrom(idx: number) {
    if (!ready) return;
    void playUris(allUris, idx);
  }

  if (selection === null) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Pick something on the left.
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        No tracks for this selection.
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div className="sticky top-0 z-10 grid grid-cols-[40px_1fr_1fr_1fr_60px] items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-xs uppercase tracking-wide text-zinc-500">
        <span>#</span>
        <span>Title</span>
        <span>Artist</span>
        <span>Album</span>
        <span className="text-right">Time</span>
      </div>
      <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
        {virt.getVirtualItems().map(v => {
          const t = tracks[v.index];
          const trackUri = `spotify:track:${t.spotify_id}`;
          const isPlaying = trackUri === currentUri;
          return (
            <div
              key={t.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${v.start}px)`,
                height: v.size,
              }}
              onClick={() => playOne(v.index)}
              onDoubleClick={() => playAllFrom(v.index)}
              className={`grid cursor-pointer grid-cols-[40px_1fr_1fr_1fr_60px] items-center gap-2 px-4 text-sm hover:bg-zinc-900 ${
                isPlaying ? 'bg-emerald-900/30 text-emerald-100' : 'text-zinc-300'
              }`}
              title="click: play this track · double-click: play this and the rest"
            >
              <span className="text-xs text-zinc-500">
                {isPlaying
                  ? '▶'
                  : t.disc_number != null && t.track_number != null
                    ? `${t.disc_number}.${t.track_number}`
                    : (t.track_number ?? '')}
              </span>
              <span className="truncate" title={t.name}>
                {t.name}
              </span>
              <span className="truncate text-zinc-400" title={t.artist_names ?? ''}>
                {t.artist_names ?? '—'}
              </span>
              <span className="truncate text-zinc-400" title={t.album_name}>
                {t.album_name}
              </span>
              <span className="text-right text-xs text-zinc-500">
                {fmtDuration(t.duration_ms)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
