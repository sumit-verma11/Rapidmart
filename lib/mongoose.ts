import mongoose from "mongoose";

// Use a global cached connection to avoid reconnecting on every hot-reload in dev
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("MONGO_URI environment variable is not set");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        dbName: "rapidmart",
      })
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
