// ─── Favorites Service ──────────────────────────────────────

import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import type { Track } from "../types.ts";
import { COLLECTIONS } from "../constants.ts";
import logger from "../logger.ts";

let database: Db;

export function init(databaseInstance: Db): void {
  database = databaseInstance;
}

export async function setupIndexes(): Promise<void> {
  const collection = database.collection(COLLECTIONS.FAVORITES);
  await collection.createIndex({ trackId: 1 }, { unique: true });
  await collection.createIndex({ addedAt: -1 });
  logger.info("Favorites indexes created");
}

export async function getFavorites(
  limit: number = 50,
): Promise<{ items: Track[]; total: number }> {
  const favoritesCollection = database.collection(COLLECTIONS.FAVORITES);
  const tracksCollection = database.collection<Track>(COLLECTIONS.TRACKS);

  const favorites = await favoritesCollection
    .find()
    .sort({ addedAt: -1 })
    .limit(limit)
    .toArray();

  const trackIds = favorites.map(
    (favorite) => new ObjectId(favorite.trackId),
  );
  const tracks = await tracksCollection
    .find({ _id: { $in: trackIds as unknown as string[] } })
    .toArray();

  const total = await favoritesCollection.countDocuments();

  return { items: tracks as Track[], total };
}

export async function addFavorite(trackId: string): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.FAVORITES);
  try {
    await collection.insertOne({
      trackId,
      addedAt: new Date(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function removeFavorite(trackId: string): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.FAVORITES);
  const result = await collection.deleteOne({ trackId });
  return result.deletedCount > 0;
}

export async function isFavorite(trackId: string): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.FAVORITES);
  const count = await collection.countDocuments({ trackId });
  return count > 0;
}
