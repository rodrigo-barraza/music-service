// ─── Constants ──────────────────────────────────────────────

export const COLLECTIONS = {
  TRACKS: "tracks",
  ALBUMS: "albums",
  ARTISTS: "artists",
  PLAYLISTS: "playlists",
  FAVORITES: "favorites",
  PLAY_HISTORY: "playHistory",
} as const;

export const SORT_FIELDS = {
  TITLE_ASC: { title: 1 },
  TITLE_DESC: { title: -1 },
  ARTIST_ASC: { artist: 1 },
  ARTIST_DESC: { artist: -1 },
  ALBUM_ASC: { album: 1 },
  ALBUM_DESC: { album: -1 },
  ADDED_ASC: { addedAt: 1 },
  ADDED_DESC: { addedAt: -1 },
  DURATION_ASC: { durationSeconds: 1 },
  DURATION_DESC: { durationSeconds: -1 },
  TRACK_NUMBER_ASC: { trackNumber: 1 },
} as const;

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
