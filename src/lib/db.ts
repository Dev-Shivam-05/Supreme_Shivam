import mongoose from "mongoose";
import { env } from "./env";

/**
 * Cached Mongoose connection (survives HMR in dev, reused across lambda
 * invocations in prod). Returns null when MONGODB_URI is not configured,
 * so callers can no-op cleanly.
 */
type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  failedAt: number;
};

const globalForMongoose = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = globalForMongoose._mongoose ?? { conn: null, promise: null, failedAt: 0 };
globalForMongoose._mongoose = cache;

// After a failed connect, back off before retrying so a build/outage doesn't
// hammer the DB and flood the logs with one identical error per call.
const RETRY_COOLDOWN_MS = 30_000;

export async function dbConnect(): Promise<typeof mongoose | null> {
  if (!env.MONGODB_URI) return null;
  if (cache.conn) return cache.conn;
  if (cache.failedAt && Date.now() - cache.failedAt < RETRY_COOLDOWN_MS) return null;
  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cache.conn = await cache.promise;
    cache.failedAt = 0;
    return cache.conn;
  } catch (err) {
    cache.promise = null;
    if (!cache.failedAt) console.error("[db] connection unavailable:", (err as Error).message);
    cache.failedAt = Date.now();
    return null;
  }
}
