// ─── Library Routes ─────────────────────────────────────────

import { Router } from "express";
import type { Request, Response } from "express";
import * as LibraryService from "../services/LibraryService.ts";

const router = Router();

// GET /library/tracks — Browse tracks with filtering and pagination
router.get("/tracks", async (request: Request, response: Response) => {
  const options = {
    sort: request.query.sort as string | undefined,
    search: request.query.search as string | undefined,
    artist: request.query.artist as string | undefined,
    album: request.query.album as string | undefined,
    genre: request.query.genre as string | undefined,
    limit: request.query.limit ? parseInt(request.query.limit as string, 10) : undefined,
    offset: request.query.offset ? parseInt(request.query.offset as string, 10) : undefined,
  };

  const result = await LibraryService.browseTracks(options);
  response.json(result);
});

// GET /library/tracks/:id — Get a single track by ID
router.get("/tracks/:id", async (request: Request, response: Response) => {
  const track = await LibraryService.getTrackById(request.params.id as string);
  if (!track) {
    response.status(404).json({ error: "Track not found" });
    return;
  }
  response.json(track);
});

// GET /library/albums — Browse albums
router.get("/albums", async (request: Request, response: Response) => {
  const options = {
    search: request.query.search as string | undefined,
    artist: request.query.artist as string | undefined,
    limit: request.query.limit ? parseInt(request.query.limit as string, 10) : undefined,
    offset: request.query.offset ? parseInt(request.query.offset as string, 10) : undefined,
  };

  const result = await LibraryService.getAlbums(options);
  response.json(result);
});

// GET /library/albums/:title/:artist — Get tracks for an album
router.get("/albums/:title/:artist", async (request: Request, response: Response) => {
  const tracks = await LibraryService.getAlbumTracks(
    decodeURIComponent(request.params.title as string),
    decodeURIComponent(request.params.artist as string),
  );
  response.json({ items: tracks });
});

// GET /library/artists — Browse artists
router.get("/artists", async (request: Request, response: Response) => {
  const options = {
    search: request.query.search as string | undefined,
    limit: request.query.limit ? parseInt(request.query.limit as string, 10) : undefined,
    offset: request.query.offset ? parseInt(request.query.offset as string, 10) : undefined,
  };

  const result = await LibraryService.getArtists(options);
  response.json(result);
});

// GET /library/genres — List all genres
router.get("/genres", async (_request: Request, response: Response) => {
  const genres = await LibraryService.getGenres();
  response.json({ items: genres });
});

// GET /library/stats — Library statistics
router.get("/stats", async (_request: Request, response: Response) => {
  const stats = await LibraryService.getLibraryStats();
  response.json(stats);
});

export default router;
