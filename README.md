# Music Service

Audio streaming backend — local filesystem library indexing, metadata extraction, streaming, playlists, and favorites.

## Architecture

Express 5 + MongoDB + MinIO backend service that:
- Scans filesystem roots for audio files (MP3, FLAC, M4A, AAC, OGG, WAV, etc.)
- Extracts metadata using `music-metadata` (ID3 tags, duration, bitrate, cover art)
- Indexes tracks, albums, and artists in MongoDB
- Streams audio with HTTP Range request support
- Manages playlists and favorites

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/library/tracks` | Browse tracks with filtering |
| GET | `/library/tracks/:id` | Get track by ID |
| GET | `/library/albums` | Browse albums |
| GET | `/library/albums/:title/:artist` | Get album tracks |
| GET | `/library/artists` | Browse artists |
| GET | `/library/genres` | List genres |
| GET | `/library/stats` | Library statistics |
| GET | `/media/stream/:id` | Stream audio (Range supported) |
| GET | `/playlists` | List playlists |
| POST | `/playlists` | Create playlist |
| PATCH | `/playlists/:id` | Update playlist |
| DELETE | `/playlists/:id` | Delete playlist |
| POST | `/playlists/:id/tracks` | Add track to playlist |
| DELETE | `/playlists/:id/tracks/:trackId` | Remove track |
| GET | `/favorites` | List favorites |
| POST | `/favorites` | Add favorite |
| DELETE | `/favorites/:trackId` | Remove favorite |
| POST | `/scan` | Trigger library scan |
| GET | `/scan/status` | Check scan status |
| GET | `/health` | Health check |

## Development

```bash
npm install
npm run dev     # Watch mode with tsx
npm run build   # TypeScript compile
npm test        # Run tests
npm run deploy  # Build & deploy to NAS
```

## Configuration

All configuration comes from the Vault service. Key variables:
- `MUSIC_SERVICE_PORT` — Server port (default: 5613)
- `MONGO_URI` — MongoDB connection string
- `MUSIC_AUDIO_ROOTS` — Comma-separated paths to scan
- `MINIO_ENDPOINT` — MinIO for cover art storage
