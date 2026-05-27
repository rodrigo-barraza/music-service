// ─── Library Service ────────────────────────────────────────

import type { Db, Sort, Document } from "mongodb";
import type { Track, Album, Artist, BrowseOptions, PaginatedResponse } from "../types.ts";
import { COLLECTIONS, SORT_FIELDS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.ts";
import logger from "../logger.ts";

let database: Db;

export function init(databaseInstance: Db): void {
  database = databaseInstance;
}

export async function setupCollections(): Promise<void> {
  const tracksCollection = database.collection(COLLECTIONS.TRACKS);
  const albumsCollection = database.collection(COLLECTIONS.ALBUMS);
  const artistsCollection = database.collection(COLLECTIONS.ARTISTS);

  await tracksCollection.createIndex({ filePath: 1 }, { unique: true });
  await tracksCollection.createIndex({ fileHash: 1 });
  await tracksCollection.createIndex({ title: "text", artist: "text", album: "text" });
  await tracksCollection.createIndex({ artist: 1, album: 1, trackNumber: 1 });
  await tracksCollection.createIndex({ addedAt: -1 });
  await tracksCollection.createIndex({ genre: 1 });

  await albumsCollection.createIndex({ title: 1, artist: 1 }, { unique: true });
  await albumsCollection.createIndex({ artist: 1 });

  await artistsCollection.createIndex({ name: 1 }, { unique: true });

  logger.info("Library indexes created");
}

export async function browseTracks(
  options: BrowseOptions,
): Promise<PaginatedResponse<Track>> {
  const collection = database.collection(COLLECTIONS.TRACKS);
  const filter: Document = {};
  const limit = Math.min(options.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = options.offset || 0;

  if (options.search) {
    filter.$text = { $search: options.search };
  }
  if (options.artist) {
    filter.artist = { $regex: options.artist, $options: "i" };
  }
  if (options.album) {
    filter.album = { $regex: options.album, $options: "i" };
  }
  if (options.genre) {
    filter.genre = { $regex: options.genre, $options: "i" };
  }

  const sortKey = (options.sort || "ADDED_DESC") as keyof typeof SORT_FIELDS;
  const sort: Sort = (SORT_FIELDS[sortKey] as unknown as Sort) || (SORT_FIELDS.ADDED_DESC as unknown as Sort);

  const [items, total] = await Promise.all([
    collection.find(filter).sort(sort).skip(offset).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items as unknown as Track[], total, limit, offset };
}

export async function getTrackById(trackId: string): Promise<Track | null> {
  const { ObjectId } = await import("mongodb");
  const collection = database.collection<Track>(COLLECTIONS.TRACKS);
  return collection.findOne({ _id: new ObjectId(trackId) as unknown as string });
}

export async function getAlbums(
  options: BrowseOptions,
): Promise<PaginatedResponse<Album>> {
  const collection = database.collection(COLLECTIONS.ALBUMS);
  const filter: Document = {};
  const limit = Math.min(options.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = options.offset || 0;

  if (options.search) {
    filter.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { artist: { $regex: options.search, $options: "i" } },
    ];
  }
  if (options.artist) {
    filter.artist = { $regex: options.artist, $options: "i" };
  }

  const [items, total] = await Promise.all([
    collection.find(filter).sort({ title: 1 }).skip(offset).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items as unknown as Album[], total, limit, offset };
}

export async function getAlbumTracks(
  albumTitle: string,
  albumArtist: string,
): Promise<Track[]> {
  const collection = database.collection<Track>(COLLECTIONS.TRACKS);
  return collection
    .find({ album: albumTitle, albumArtist: albumArtist })
    .sort({ discNumber: 1, trackNumber: 1 })
    .toArray() as Promise<unknown> as Promise<Track[]>;
}

export async function getArtists(
  options: BrowseOptions,
): Promise<PaginatedResponse<Artist>> {
  const collection = database.collection(COLLECTIONS.ARTISTS);
  const filter: Document = {};
  const limit = Math.min(options.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = options.offset || 0;

  if (options.search) {
    filter.name = { $regex: options.search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    collection.find(filter).sort({ name: 1 }).skip(offset).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items as unknown as Artist[], total, limit, offset };
}

export async function getGenres(): Promise<string[]> {
  const collection = database.collection<Track>(COLLECTIONS.TRACKS);
  return collection.distinct("genre", { genre: { $ne: "" } });
}

export async function getLibraryStats(): Promise<{
  trackCount: number;
  albumCount: number;
  artistCount: number;
  totalDurationSeconds: number;
}> {
  const tracksCollection = database.collection(COLLECTIONS.TRACKS);
  const albumsCollection = database.collection(COLLECTIONS.ALBUMS);
  const artistsCollection = database.collection(COLLECTIONS.ARTISTS);

  const [trackCount, albumCount, artistCount, durationResult] = await Promise.all([
    tracksCollection.countDocuments(),
    albumsCollection.countDocuments(),
    artistsCollection.countDocuments(),
    tracksCollection
      .aggregate([{ $group: { _id: null, total: { $sum: "$durationSeconds" } } }])
      .toArray(),
  ]);

  const totalDurationSeconds = durationResult[0]?.total || 0;

  return { trackCount, albumCount, artistCount, totalDurationSeconds };
}
