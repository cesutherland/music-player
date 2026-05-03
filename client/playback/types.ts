// Minimal subset of the Spotify Web Playback SDK surface we use.
// https://developer.spotify.com/documentation/web-playback-sdk/reference

export type SdkArtist = { uri: string; name: string };
export type SdkAlbum = { uri: string; name: string; images: { url: string }[] };
export type SdkTrack = {
  uri: string;
  id: string | null;
  name: string;
  duration_ms: number;
  artists: SdkArtist[];
  album: SdkAlbum;
};

export type SdkPlaybackState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SdkTrack | null;
    previous_tracks: SdkTrack[];
    next_tracks: SdkTrack[];
  };
};

export type SpotifyPlayer = {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: 'ready', cb: (e: { device_id: string }) => void): boolean;
  addListener(event: 'not_ready', cb: (e: { device_id: string }) => void): boolean;
  addListener(
    event: 'player_state_changed',
    cb: (s: SdkPlaybackState | null) => void,
  ): boolean;
  addListener(event: 'autoplay_failed', cb: () => void): boolean;
  addListener(
    event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
    cb: (e: { message: string }) => void,
  ): boolean;
  removeListener(event: string): boolean;
  togglePlay(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(v: number): Promise<void>;
  getCurrentState(): Promise<SdkPlaybackState | null>;
};

declare global {
  interface Window {
    Spotify?: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
