// ─── Scan Service ───────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Db } from "mongodb";
import CONFIG from "../config.ts";
import { COLLECTIONS } from "../constants.ts";
import logger from "../logger.ts";

let database: Db;
let isScanning = false;

export function init(databaseInstance: Db): void {
  database = databaseInstance;
}

function computeFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

async function parseAudioMetadata(filePath: string) {
  const { parseFile } = await import("music-metadata");
  try {
    const metadata = await parseFile(filePath);
    const common = metadata.common;
    const format = metadata.format;

    return {
      title: common.title || path.basename(filePath, path.extname(filePath)),
      artist: common.artist || "Unknown Artist",
      albumArtist: common.albumartist || common.artist || "Unknown Artist",
      album: common.album || "Unknown Album",
      genre: common.genre?.[0] || "",
      year: common.year || null,
      trackNumber: common.track?.no || null,
      discNumber: common.disk?.no || null,
      durationSeconds: Math.round(format.duration || 0),
      format: format.codec || path.extname(filePath).slice(1).toUpperCase(),
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      sampleRate: format.sampleRate || null,
      channels: format.numberOfChannels || null,
      hasCoverArt: (common.picture?.length || 0) > 0,
    };
  } catch (error) {
    logger.warn(`Failed to parse metadata for ${filePath}: ${error}`);
    return {
      title: path.basename(filePath, path.extname(filePath)),
      artist: "Unknown Artist",
      albumArtist: "Unknown Artist",
      album: "Unknown Album",
      genre: "",
      year: null,
      trackNumber: null,
      discNumber: null,
      durationSeconds: 0,
      format: path.extname(filePath).slice(1).toUpperCase(),
      bitrate: null,
      sampleRate: null,
      channels: null,
      hasCoverArt: false,
    };
  }
}

function walkDirectory(directoryPath: string, extensions: string[]): string[] {
  const results: string[] = [];

  try {
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.name.startsWith(".")) continue;

      if (entry.isDirectory()) {
        results.push(...walkDirectory(fullPath, extensions));
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();
        if (extensions.includes(extension)) {
          results.push(fullPath);
        }
      }
    }
  } catch (error) {
    logger.warn(`Cannot read directory ${directoryPath}: ${error}`);
  }

  return results;
}

export async function runScan(): Promise<{
  tracksAdded: number;
  tracksUpdated: number;
  tracksRemoved: number;
}> {
  if (isScanning) {
    logger.warn("Scan already in progress — skipping");
    return { tracksAdded: 0, tracksUpdated: 0, tracksRemoved: 0 };
  }

  isScanning = true;
  const startTime = Date.now();
  let tracksAdded = 0;
  let tracksUpdated = 0;
  let tracksRemoved = 0;

  try {
    const tracksCollection = database.collection(COLLECTIONS.TRACKS);
    const albumsCollection = database.collection(COLLECTIONS.ALBUMS);
    const artistsCollection = database.collection(COLLECTIONS.ARTISTS);

    const discoveredFiles: string[] = [];
    for (const root of CONFIG.AUDIO_ROOTS) {
      if (fs.existsSync(root)) {
        discoveredFiles.push(
          ...walkDirectory(root, CONFIG.SUPPORTED_EXTENSIONS),
        );
      }
    }

    logger.info(`Discovered ${discoveredFiles.length} audio files`);

    const existingTracks = await tracksCollection
      .find({}, { projection: { filePath: 1, fileHash: 1 } })
      .toArray();
    const existingPathMap = new Map(
      existingTracks.map((track) => [track.filePath, track.fileHash]),
    );

    for (const filePath of discoveredFiles) {
      try {
        const stat = fs.statSync(filePath);
        const fileHash = computeFileHash(filePath);

        if (existingPathMap.has(filePath)) {
          if (existingPathMap.get(filePath) !== fileHash) {
            const metadata = await parseAudioMetadata(filePath);
            await tracksCollection.updateOne(
              { filePath },
              {
                $set: {
                  ...metadata,
                  fileSize: stat.size,
                  fileHash,
                  modifiedAt: new Date(),
                },
              },
            );
            tracksUpdated++;
          }
          existingPathMap.delete(filePath);
        } else {
          const metadata = await parseAudioMetadata(filePath);
          await tracksCollection.insertOne({
            ...metadata,
            filePath,
            fileSize: stat.size,
            fileHash,
            coverArtPath: null,
            addedAt: new Date(),
            modifiedAt: new Date(),
          });
          tracksAdded++;
        }
      } catch (error) {
        logger.warn(`Error processing ${filePath}: ${error}`);
      }
    }

    // Remove tracks whose files no longer exist
    const removedPaths = Array.from(existingPathMap.keys());
    if (removedPaths.length > 0) {
      await tracksCollection.deleteMany({
        filePath: { $in: removedPaths },
      });
      tracksRemoved = removedPaths.length;
    }

    // Rebuild albums aggregate
    const albumAggregation = await tracksCollection
      .aggregate([
        {
          $group: {
            _id: { album: "$album", artist: "$albumArtist" },
            year: { $first: "$year" },
            genre: { $first: "$genre" },
            trackCount: { $sum: 1 },
            coverArtPath: { $first: "$coverArtPath" },
            addedAt: { $min: "$addedAt" },
          },
        },
      ])
      .toArray();

    await albumsCollection.deleteMany({});
    if (albumAggregation.length > 0) {
      await albumsCollection.insertMany(
        albumAggregation.map((album) => ({
          title: album._id.album,
          artist: album._id.artist,
          year: album.year,
          genre: album.genre,
          trackCount: album.trackCount,
          coverArtPath: album.coverArtPath,
          addedAt: album.addedAt,
        })),
      );
    }

    // Rebuild artists aggregate
    const artistAggregation = await tracksCollection
      .aggregate([
        {
          $group: {
            _id: "$artist",
            albumCount: { $addToSet: "$album" },
            trackCount: { $sum: 1 },
            addedAt: { $min: "$addedAt" },
          },
        },
        {
          $project: {
            name: "$_id",
            albumCount: { $size: "$albumCount" },
            trackCount: 1,
            addedAt: 1,
          },
        },
      ])
      .toArray();

    await artistsCollection.deleteMany({});
    if (artistAggregation.length > 0) {
      await artistsCollection.insertMany(
        artistAggregation.map((artist) => ({
          name: artist.name,
          albumCount: artist.albumCount,
          trackCount: artist.trackCount,
          addedAt: artist.addedAt,
        })),
      );
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(
      `Scan complete in ${elapsed}s — added: ${tracksAdded}, updated: ${tracksUpdated}, removed: ${tracksRemoved}`,
    );
  } finally {
    isScanning = false;
  }

  return { tracksAdded, tracksUpdated, tracksRemoved };
}

export function getIsScanning(): boolean {
  return isScanning;
}
