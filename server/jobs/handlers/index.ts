import type { Job } from '../queue';
import type { JobKind } from '../../../shared/jobs';
import { importOrchestrator } from './import-orchestrator';
import { importSavedTracksPage } from './import-saved-tracks-page';

export const HANDLERS: Record<JobKind, (job: Job) => Promise<void>> = {
  'import-orchestrator': importOrchestrator,
  'import-saved-tracks-page': importSavedTracksPage,
  // Stubs for slices 4–5; the queue won't enqueue them until those slices land.
  'import-saved-albums-page': async () => {
    throw new Error('not implemented (slice 4)');
  },
  'import-playlists-page': async () => {
    throw new Error('not implemented (slice 4)');
  },
  'import-playlist-items-page': async () => {
    throw new Error('not implemented (slice 4)');
  },
  'hydrate-artist': async () => {
    throw new Error('not implemented (slice 5)');
  },
};
