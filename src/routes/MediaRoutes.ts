// ─── Media Routes ───────────────────────────────────────────

import { Router } from "express";
import type { Request, Response } from "express";
import * as LibraryService from "../services/LibraryService.ts";
import * as StreamService from "../services/StreamService.ts";

const router = Router();

// GET /media/stream/:trackId — Stream audio file with Range support
router.get("/stream/:trackId", async (request: Request, response: Response) => {
  const track = await LibraryService.getTrackById(request.params.trackId as string);
  if (!track) {
    response.status(404).json({ error: "Track not found" });
    return;
  }

  StreamService.streamAudio(track.filePath, request, response);
});

export default router;
