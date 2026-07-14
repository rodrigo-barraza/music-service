// ─── Entry Point ────────────────────────────────────────────

import { createService } from "@rodrigo-barraza/utilities-library/service";
import type { Application, Request, Response, NextFunction } from "express";
import configuration from "./config.ts";

// ─── Collection Setup ──────────────────────────────────────────
import { setupCollections, init as initLibrary } from "./services/LibraryService.ts";
import { init as initScan } from "./services/ScanService.ts";
import { setupIndexes as setupPlaylistIndexes, init as initPlaylists } from "./services/PlaylistService.ts";
import { setupIndexes as setupFavoritesIndexes, init as initFavorites } from "./services/FavoritesService.ts";

// ─── Routes ────────────────────────────────────────────────────
import libraryRoutes from "./routes/LibraryRoutes.ts";
import mediaRoutes from "./routes/MediaRoutes.ts";
import playlistRoutes from "./routes/PlaylistRoutes.ts";
import favoritesRoutes from "./routes/FavoritesRoutes.ts";
import scanRoutes from "./routes/ScanRoutes.ts";

import type { ServiceContext } from "@rodrigo-barraza/utilities-library/service";

// ─── Service Bootstrap ────────────────────────────────────────

await createService({
  name: "music-service",
  version: "0.1.0",
  port: configuration.MUSIC_SERVICE_PORT,
  description:
    "Audio streaming backend — local filesystem library indexing, metadata, streaming, playlists",
  mongo: {
    uri: configuration.MONGODB_URI!,
    dbName: configuration.MONGODB_DB_NAME,
  },
  routes: [
    { path: "/library", router: libraryRoutes },
    { path: "/media", router: mediaRoutes },
    { path: "/playlists", router: playlistRoutes },
    { path: "/favorites", router: favoritesRoutes },
    { path: "/scan", router: scanRoutes },
  ],
  beforeRoutes: async (app: Application, context: ServiceContext) => {
    const database = context.db!;

    // Expose streaming headers needed for audio Range requests
    app.use((_request: Request, response: Response, next: NextFunction) => {
      response.header(
        "Access-Control-Expose-Headers",
        "Content-Range, Accept-Ranges, Content-Length",
      );
      next();
    });

    // Initialize services with database reference
    initLibrary(database);
    initScan(database);
    initPlaylists(database);
    initFavorites(database);

    // Setup database collections and indexes
    await setupCollections();
    await setupPlaylistIndexes();
    await setupFavoritesIndexes();
  },
  cron: [],
});
