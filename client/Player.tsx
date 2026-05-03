import { useEffect, useRef, useState } from 'react';
import { destroyPlayer, getOrInitPlayer } from './playback/sdk';
import { usePlayback } from './playback/store';
import type { SpotifyPlayer } from './playback/types';

function fmt(ms: number): string {
  if (!ms || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${sec}`;
  }
  return `${m}:${sec}`;
}

export function Player() {
  const { setDeviceId, applySdkState, setError } = usePlayback();
  const playerRef = useRef<SpotifyPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrInitPlayer({
      onReady: id => !cancelled && setDeviceId(id || null),
      onState: s => !cancelled && applySdkState(s),
      onError: (kind, message) => !cancelled && setError(kind, message),
    })
      .then(p => {
        if (cancelled) return;
        playerRef.current = p;
      })
      .catch(err => {
        if (!cancelled) setError('initialization_error', String(err));
      });
    return () => {
      cancelled = true;
      destroyPlayer();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = usePlayback(s => s.ready);
  const premiumError = usePlayback(s => s.premiumError);
  const errorMessage = usePlayback(s => s.errorMessage);

  if (premiumError) {
    return (
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-rose-300">
        <span>Premium required for in-browser playback.</span>
        {errorMessage && <span className="text-xs text-zinc-500">{errorMessage}</span>}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col border-t border-zinc-800 bg-zinc-950">
      {errorMessage && (
        <div className="border-b border-amber-900/60 bg-amber-950/40 px-4 py-1 text-xs text-amber-300">
          {errorMessage}
        </div>
      )}
      <div className="flex items-center gap-4 px-4 py-2 text-sm">
        <NowPlaying />
        <div className="flex flex-1 flex-col items-center gap-1">
          <Transport player={playerRef.current} ready={ready} />
          <Scrubber player={playerRef.current} />
        </div>
        <VolumeControl player={playerRef.current} />
      </div>
    </div>
  );
}

function NowPlaying() {
  const current = usePlayback(s => s.current);
  if (!current) {
    return <div className="w-72 shrink-0 truncate text-zinc-500">Pick a track to play.</div>;
  }
  return (
    <div className="flex w-72 shrink-0 items-center gap-3">
      {current.album_image && (
        <img
          src={current.album_image}
          alt=""
          className="h-10 w-10 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="truncate font-medium text-zinc-100">{current.name}</div>
        <div className="truncate text-xs text-zinc-400">
          {current.artists.join(', ')} — {current.album_name}
        </div>
      </div>
    </div>
  );
}

function Transport({
  player,
  ready,
}: {
  player: SpotifyPlayer | null;
  ready: boolean;
}) {
  const paused = usePlayback(s => s.paused);
  const disabled = !player || !ready;
  return (
    <div className="flex items-center gap-3 text-zinc-300">
      <button
        disabled={disabled}
        onClick={() => player?.previousTrack()}
        className="rounded px-2 py-1 hover:text-zinc-100 disabled:opacity-40"
        title="Previous"
      >
        ⏮
      </button>
      <button
        disabled={disabled}
        onClick={() => player?.togglePlay()}
        className="rounded bg-zinc-100 px-3 py-1 text-zinc-950 hover:bg-white disabled:opacity-40"
        title={paused ? 'Play' : 'Pause'}
      >
        {paused ? '▶' : '❚❚'}
      </button>
      <button
        disabled={disabled}
        onClick={() => player?.nextTrack()}
        className="rounded px-2 py-1 hover:text-zinc-100 disabled:opacity-40"
        title="Next"
      >
        ⏭
      </button>
    </div>
  );
}

function Scrubber({ player }: { player: SpotifyPlayer | null }) {
  const positionMs = usePlayback(s => s.positionMs);
  const positionAt = usePlayback(s => s.positionAt);
  const durationMs = usePlayback(s => s.durationMs);
  const paused = usePlayback(s => s.paused);
  const setPositionLocal = usePlayback(s => s.setPositionLocal);

  // Force a re-render every 250ms while playing for interpolation.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick(t => (t + 1) % 1_000_000), 250);
    return () => clearInterval(id);
  }, [paused]);

  const interpolated = paused
    ? positionMs
    : Math.min(positionMs + (Date.now() - positionAt), durationMs || 0);

  const ratio = durationMs > 0 ? interpolated / durationMs : 0;

  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!player || !durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = Math.floor(pct * durationMs);
    setPositionLocal(target);
    void player.seek(target);
  }

  return (
    <div className="flex w-full items-center gap-2 text-xs text-zinc-500">
      <span className="w-10 text-right tabular-nums">{fmt(interpolated)}</span>
      <div
        className="group h-1 flex-1 cursor-pointer rounded-full bg-zinc-800"
        onClick={onSeek}
      >
        <div
          className="h-full rounded-full bg-emerald-500 group-hover:bg-emerald-400"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="w-10 tabular-nums">{fmt(durationMs)}</span>
    </div>
  );
}

function VolumeControl({ player }: { player: SpotifyPlayer | null }) {
  const volume = usePlayback(s => s.volume);
  const setVolumeLocal = usePlayback(s => s.setVolumeLocal);
  return (
    <div className="flex w-32 shrink-0 items-center gap-2 text-xs text-zinc-500">
      <span>vol</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        onChange={e => {
          const v = Number(e.target.value) / 100;
          setVolumeLocal(v);
          void player?.setVolume(v);
        }}
        className="w-full accent-emerald-500"
      />
    </div>
  );
}
