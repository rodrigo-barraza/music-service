// ─── Configuration ──────────────────────────────────────────

import type { MusicConfig } from "./types.ts";

const configuration: MusicConfig = {
  MUSIC_SERVICE_PORT:
    parseInt(process.env.MUSIC_SERVICE_PORT ?? "", 10) || 5614,
  MONGODB_URI: process.env.MONGO_URI,
  MONGODB_DB_NAME: process.env.MONGO_DB_NAME || "music",

  // ── Audio roots (bind-mounted from host, comma-separated) ──
  AUDIO_ROOTS: (process.env.MUSIC_AUDIO_ROOTS || "/media")
    .split(",")
    .map((path) => path.trim()),

  // ── Library scanning ────────────────────────────────────────
  SCAN_INTERVAL_MINUTES:
    parseInt(process.env.MUSIC_SCAN_INTERVAL_MINUTES ?? "", 10) || 60,

  // ── MinIO ───────────────────────────────────────────────────
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
  MINIO_BUCKET: process.env.MUSIC_MINIO_BUCKET || "music",
  MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL,

  // ── Auth ────────────────────────────────────────────────────
  AUTH_ENABLED: process.env.AUTH_ENABLED === "true",

  // ── Supported audio extensions ──────────────────────────────
  SUPPORTED_EXTENSIONS: (
    process.env.MUSIC_SUPPORTED_EXTENSIONS ||
    ".mp3,.flac,.m4a,.aac,.ogg,.opus,.wav,.wma,.aiff"
  )
    .split(",")
    .map((extension) => extension.trim().toLowerCase()),
};

export default configuration;
