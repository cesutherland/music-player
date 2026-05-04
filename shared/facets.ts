export const FACET_FIELDS = [
  'album_artist',
  'track_artist',
  'album',
  'playlist',
  'genre',
  'year_added',
  'month_added',
  'year_released',
  'decade_released',
  'album_type',
  'explicit',
] as const;

export type FacetField = (typeof FACET_FIELDS)[number];

export type FacetChain = FacetField[];

export type FacetNode = {
  key: string;
  label: string;
  count: number;
  has_children: boolean;
};

export type FacetPath = string[];

export const FACET_LABELS: Record<FacetField, string> = {
  album_artist: 'Album artist',
  track_artist: 'Track artist',
  album: 'Album',
  playlist: 'Playlist',
  genre: 'Genre',
  year_added: 'Year added',
  month_added: 'Month added',
  year_released: 'Year released',
  decade_released: 'Decade released',
  album_type: 'Album type',
  explicit: 'Explicit',
};

export const DEFAULT_CHAIN: FacetChain = ['album_artist', 'album'];

export const FACET_PRESETS: { name: string; chain: FacetChain }[] = [
  { name: 'Artist / Album', chain: ['album_artist', 'album'] },
  { name: 'Year added / Album', chain: ['year_added', 'album'] },
  { name: 'Year / Month added', chain: ['year_added', 'month_added'] },
  { name: 'Genre / Artist / Album', chain: ['genre', 'album_artist', 'album'] },
  { name: 'Playlist', chain: ['playlist'] },
  { name: 'Decade / Album', chain: ['decade_released', 'album'] },
];

export function isFacetField(s: unknown): s is FacetField {
  return (
    typeof s === 'string' && (FACET_FIELDS as readonly string[]).includes(s)
  );
}

export function validateChain(chain: unknown): chain is FacetChain {
  return (
    Array.isArray(chain) &&
    chain.length >= 1 &&
    chain.length <= 3 &&
    chain.every(isFacetField)
  );
}
