// ─── URL Rewrite Middleware ──────────────────────────────────
// Rewrites MinIO internal URLs to public-facing URLs in JSON responses.

import type { Request, Response, NextFunction } from "express";

const MINIO_INTERNAL = process.env.MINIO_INTERNAL_URL || process.env.MINIO_ENDPOINT;
const MINIO_PUBLIC = process.env.MINIO_PUBLIC_URL;

export default function urlRewriteMiddleware(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!MINIO_INTERNAL || !MINIO_PUBLIC) {
    next();
    return;
  }

  const originalJson = response.json.bind(response);
  response.json = function (body: unknown) {
    if (typeof body === "string") {
      body = body.replaceAll(MINIO_INTERNAL, MINIO_PUBLIC);
    } else if (body && typeof body === "object") {
      const serialized = JSON.stringify(body);
      body = JSON.parse(serialized.replaceAll(MINIO_INTERNAL, MINIO_PUBLIC));
    }
    return originalJson(body);
  };

  next();
}
