export type JobKind =
  | 'import-orchestrator'
  | 'import-saved-tracks-page'
  | 'import-saved-albums-page'
  | 'import-album-tracks-page'
  | 'import-playlists-page'
  | 'import-playlist-items-page'
  | 'hydrate-artist';

export const JOB_KINDS: JobKind[] = [
  'import-orchestrator',
  'import-saved-tracks-page',
  'import-saved-albums-page',
  'import-album-tracks-page',
  'import-playlists-page',
  'import-playlist-items-page',
  'hydrate-artist',
];

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export type ImportProgress = {
  tracks: { total: number; progress: number };
  albums: { total: number; progress: number };
  playlists: { total: number; progress: number };
  artists: { total: number; progress: number };
};
