// ─── Stream Service ─────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import CONFIG from "../config.ts";
import logger from "../logger.ts";

const AUDIO_MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".wav": "audio/wav",
  ".wma": "audio/x-ms-wma",
  ".aiff": "audio/aiff",
};

function isPathWithinAudioRoots(resolvedPath: string): boolean {
  return CONFIG.AUDIO_ROOTS.some(
    (root) => resolvedPath.startsWith(root + path.sep) || resolvedPath === root,
  );
}

export function streamAudio(filePath: string, request: Request, response: Response): void {
  const resolvedPath = path.resolve(filePath);

  if (!isPathWithinAudioRoots(resolvedPath)) {
    logger.warn(`Path traversal attempt blocked: ${filePath}`);
    response.status(403).json({ error: "Access denied" });
    return;
  }

  if (!fs.existsSync(resolvedPath)) {
    response.status(404).json({ error: "File not found" });
    return;
  }

  const stat = fs.statSync(resolvedPath);
  const fileExtension = path.extname(resolvedPath).toLowerCase();
  const mimeType = AUDIO_MIME_TYPES[fileExtension] || "application/octet-stream";
  const fileSize = stat.size;

  const rangeHeader = request.headers.range;

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(resolvedPath, { start, end });

    response.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
    });

    stream.pipe(response);
  } else {
    response.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
    });

    fs.createReadStream(resolvedPath).pipe(response);
  }
}
