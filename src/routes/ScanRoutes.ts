// ─── Scan Routes ────────────────────────────────────────────

import { Router } from "express";
import type { Request, Response } from "express";
import * as ScanService from "../services/ScanService.ts";

const router = Router();

// POST /scan — Trigger a library scan
router.post("/", async (_request: Request, response: Response) => {
  if (ScanService.getIsScanning()) {
    response.status(409).json({ error: "Scan already in progress" });
    return;
  }

  const result = await ScanService.runScan();
  response.json(result);
});

// GET /scan/status — Check scan status
router.get("/status", (_request: Request, response: Response) => {
  response.json({ isScanning: ScanService.getIsScanning() });
});

export default router;
