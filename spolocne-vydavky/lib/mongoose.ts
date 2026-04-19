import mongoose from "mongoose";

// Don't validate at module load — only at runtime when connectDB() is called

// Cache connection across hot reloads in dev
const globalWithMongoose = global as typeof global & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cache = globalWithMongoose.mongoose;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    mongoose.set('bufferTimeoutMS', 30000)
    console.log('[mongoose] Connecting to:', uri.slice(0, 50) + '…')
    cache.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 35000, family: 4 }).then((m) => {
      console.log('[mongoose] Connected OK')
      return m
    }).catch((err) => {
      console.error('[mongoose] Connection FAILED:', String(err))
      cache.promise = null;
      throw err;
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

// ARTHUR DANIIL DEMYD WERE HERE
