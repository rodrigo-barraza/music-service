// ─── Types ──────────────────────────────────────────────────

export interface MusicConfig {
  MUSIC_SERVICE_PORT: number;
  MONGODB_URI: string | undefined;
  MONGODB_DB_NAME: string;
  AUDIO_ROOTS: string[];
  SCAN_INTERVAL_MINUTES: number;
  MINIO_ENDPOINT: string | undefined;
  MINIO_ACCESS_KEY: string | undefined;
  MINIO_SECRET_KEY: string | undefined;
  MINIO_BUCKET: string;
  MINIO_PUBLIC_URL: string | undefined;
  AUTH_ENABLED: boolean;
  SUPPORTED_EXTENSIONS: string[];
}

export interface Track {
  _id?: string;
  title: string;
  artist: string;
  albumArtist: string;
  album: string;
  genre: string;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  durationSeconds: number;
  filePath: string;
  fileSize: number;
  format: string;
  bitrate: number | null;
  sampleRate: number | null;
  channels: number | null;
  coverArtPath: string | null;
  addedAt: Date;
  modifiedAt: Date;
  fileHash: string;
}

export interface Album {
  _id?: string;
  title: string;
  artist: string;
  year: number | null;
  genre: string;
  trackCount: number;
  coverArtPath: string | null;
  addedAt: Date;
}

export interface Artist {
  _id?: string;
  name: string;
  albumCount: number;
  trackCount: number;
  addedAt: Date;
}

export interface Playlist {
  _id?: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  _id?: string;
  trackId: string;
  addedAt: Date;
}

export interface PlayHistoryEntry {
  _id?: string;
  trackId: string;
  playedAt: Date;
  durationListened: number;
}

export interface BrowseOptions {
  sort?: string;
  search?: string;
  artist?: string;
  album?: string;
  genre?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
