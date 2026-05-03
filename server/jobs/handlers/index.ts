import type { Job } from '../queue';
import type { JobKind } from '../../../shared/jobs';
import { importOrchestrator } from './import-orchestrator';
import { importSavedTracksPage } from './import-saved-tracks-page';
import { importSavedAlbumsPage } from './import-saved-albums-page';
import { importPlaylistsPage } from './import-playlists-page';
import { importPlaylistItemsPage } from './import-playlist-items-page';
import { hydrateArtist } from './hydrate-artist';

export const HANDLERS: Record<JobKind, (job: Job) => Promise<void>> = {
  'import-orchestrator': importOrchestrator,
  'import-saved-tracks-page': importSavedTracksPage,
  'import-saved-albums-page': importSavedAlbumsPage,
  'import-playlists-page': importPlaylistsPage,
  'import-playlist-items-page': importPlaylistItemsPage,
  'hydrate-artist': hydrateArtist,
};
