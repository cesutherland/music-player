import { create } from 'zustand';
import type { SdkPlaybackState } from './types';

type CurrentTrack = {
  uri: string;
  name: string;
  artists: string[];
  album_name: string;
  album_image: string | null;
};

type State = {
  deviceId: string | null;
  ready: boolean;
  paused: boolean;
  positionMs: number;
  durationMs: number;
  positionAt: number; // timestamp ms when positionMs was reported, for interpolation
  current: CurrentTrack | null;
  volume: number; // 0..1
  premiumError: boolean;
  errorMessage: string | null;
};

type Actions = {
  setDeviceId: (id: string | null) => void;
  applySdkState: (s: SdkPlaybackState | null) => void;
  setVolumeLocal: (v: number) => void;
  setPositionLocal: (ms: number) => void;
  setError: (kind: string, message: string) => void;
};

export const usePlayback = create<State & Actions>(set => ({
  deviceId: null,
  ready: false,
  paused: true,
  positionMs: 0,
  durationMs: 0,
  positionAt: Date.now(),
  current: null,
  volume: 0.5,
  premiumError: false,
  errorMessage: null,

  setDeviceId: deviceId => set({ deviceId, ready: !!deviceId }),
  applySdkState: s => {
    if (!s) {
      set({ paused: true, current: null });
      return;
    }
    const t = s.track_window?.current_track ?? null;
    set({
      paused: s.paused,
      positionMs: s.position,
      durationMs: s.duration,
      positionAt: Date.now(),
      current: t
        ? {
            uri: t.uri,
            name: t.name,
            artists: t.artists.map(a => a.name),
            album_name: t.album.name,
            album_image: t.album.images?.[0]?.url ?? null,
          }
        : null,
    });
  },
  setVolumeLocal: volume => set({ volume }),
  setPositionLocal: ms => set({ positionMs: ms, positionAt: Date.now() }),
  setError: (kind, message) =>
    set({
      errorMessage: `${kind}: ${message}`,
      premiumError: kind === 'account_error' || kind === 'authentication_error',
    }),
}));
