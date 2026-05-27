// ─── Playlist Routes ────────────────────────────────────────

import { Router } from "express";
import type { Request, Response } from "express";
import * as PlaylistService from "../services/PlaylistService.ts";

const router = Router();

// GET /playlists — List all playlists
router.get("/", async (_request: Request, response: Response) => {
  const playlists = await PlaylistService.getPlaylists();
  response.json({ items: playlists });
});

// GET /playlists/:playlistId — Get a single playlist
router.get("/:playlistId", async (request: Request, response: Response) => {
  const playlist = await PlaylistService.getPlaylistById(request.params.playlistId as string);
  if (!playlist) {
    response.status(404).json({ error: "Playlist not found" });
    return;
  }
  response.json(playlist);
});

// POST /playlists — Create a new playlist
router.post("/", async (request: Request, response: Response) => {
  const { name, description } = request.body;
  if (!name || typeof name !== "string") {
    response.status(400).json({ error: "Name is required" });
    return;
  }
  const playlist = await PlaylistService.createPlaylist(name, description);
  response.status(201).json(playlist);
});

// PATCH /playlists/:playlistId — Update playlist metadata
router.patch("/:playlistId", async (request: Request, response: Response) => {
  const { name, description } = request.body;
  const updated = await PlaylistService.updatePlaylist(request.params.playlistId as string, {
    name,
    description,
  });
  if (!updated) {
    response.status(404).json({ error: "Playlist not found" });
    return;
  }
  response.json({ success: true });
});

// DELETE /playlists/:playlistId — Delete a playlist
router.delete("/:playlistId", async (request: Request, response: Response) => {
  const deleted = await PlaylistService.deletePlaylist(request.params.playlistId as string);
  if (!deleted) {
    response.status(404).json({ error: "Playlist not found" });
    return;
  }
  response.json({ success: true });
});

// POST /playlists/:playlistId/tracks — Add a track to a playlist
router.post("/:playlistId/tracks", async (request: Request, response: Response) => {
  const { trackId } = request.body;
  if (!trackId || typeof trackId !== "string") {
    response.status(400).json({ error: "trackId is required" });
    return;
  }
  const added = await PlaylistService.addTrackToPlaylist(
    request.params.playlistId as string,
    trackId,
  );
  if (!added) {
    response.status(404).json({ error: "Playlist not found or track already in playlist" });
    return;
  }
  response.json({ success: true });
});

// DELETE /playlists/:playlistId/tracks/:trackId — Remove a track from a playlist
router.delete(
  "/:playlistId/tracks/:trackId",
  async (request: Request, response: Response) => {
    const removed = await PlaylistService.removeTrackFromPlaylist(
      request.params.playlistId as string,
      request.params.trackId as string,
    );
    if (!removed) {
      response.status(404).json({ error: "Playlist or track not found" });
      return;
    }
    response.json({ success: true });
  },
);

export default router;
