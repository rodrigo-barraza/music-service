// ─── Playlist Service ───────────────────────────────────────

import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import type { Playlist } from "../types.ts";
import { COLLECTIONS } from "../constants.ts";
import logger from "../logger.ts";

let database: Db;

export function init(databaseInstance: Db): void {
  database = databaseInstance;
}

export async function setupIndexes(): Promise<void> {
  const collection = database.collection(COLLECTIONS.PLAYLISTS);
  await collection.createIndex({ name: 1 });
  await collection.createIndex({ createdAt: -1 });
  logger.info("Playlist indexes created");
}

export async function getPlaylists(): Promise<Playlist[]> {
  const collection = database.collection<Playlist>(COLLECTIONS.PLAYLISTS);
  return collection.find().sort({ updatedAt: -1 }).toArray() as Promise<Playlist[]>;
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
  const collection = database.collection<Playlist>(COLLECTIONS.PLAYLISTS);
  return collection.findOne({ _id: new ObjectId(playlistId) as unknown as string });
}

export async function createPlaylist(
  name: string,
  description: string = "",
): Promise<Playlist> {
  const collection = database.collection(COLLECTIONS.PLAYLISTS);
  const now = new Date();
  const result = await collection.insertOne({
    name,
    description,
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  });

  return {
    _id: result.insertedId.toString(),
    name,
    description,
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function updatePlaylist(
  playlistId: string,
  updates: { name?: string; description?: string },
): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.PLAYLISTS);
  const result = await collection.updateOne(
    { _id: new ObjectId(playlistId) },
    { $set: { ...updates, updatedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.PLAYLISTS);
  const result = await collection.deleteOne({
    _id: new ObjectId(playlistId),
  });
  return result.deletedCount > 0;
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.PLAYLISTS);
  const result = await collection.updateOne(
    { _id: new ObjectId(playlistId) },
    {
      $addToSet: { trackIds: trackId },
      $set: { updatedAt: new Date() },
    },
  );
  return result.modifiedCount > 0;
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<boolean> {
  const collection = database.collection(COLLECTIONS.PLAYLISTS);
  const result = await collection.updateOne(
    { _id: new ObjectId(playlistId) },
    {
      $pull: { trackIds: trackId },
      $set: { updatedAt: new Date() },
    } as never,
  );
  return result.modifiedCount > 0;
}
