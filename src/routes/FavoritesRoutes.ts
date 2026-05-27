// ─── Favorites Routes ───────────────────────────────────────

import { Router } from "express";
import type { Request, Response } from "express";
import * as FavoritesService from "../services/FavoritesService.ts";

const router = Router();

// GET /favorites — List favorite tracks
router.get("/", async (request: Request, response: Response) => {
  const limit = request.query.limit
    ? parseInt(request.query.limit as string, 10)
    : 50;
  const result = await FavoritesService.getFavorites(limit);
  response.json(result);
});

// GET /favorites/:trackId — Check if a track is favorited
router.get("/:trackId", async (request: Request, response: Response) => {
  const isFavorited = await FavoritesService.isFavorite(request.params.trackId as string);
  response.json({ isFavorite: isFavorited });
});

// POST /favorites — Add a track to favorites
router.post("/", async (request: Request, response: Response) => {
  const { trackId } = request.body;
  if (!trackId || typeof trackId !== "string") {
    response.status(400).json({ error: "trackId is required" });
    return;
  }
  const added = await FavoritesService.addFavorite(trackId);
  response.status(added ? 201 : 409).json({ success: added });
});

// DELETE /favorites/:trackId — Remove from favorites
router.delete("/:trackId", async (request: Request, response: Response) => {
  const removed = await FavoritesService.removeFavorite(request.params.trackId as string);
  if (!removed) {
    response.status(404).json({ error: "Favorite not found" });
    return;
  }
  response.json({ success: true });
});

export default router;
