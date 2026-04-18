import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined')

// Cache connection across hot reloads in dev
const globalWithMongoose = global as typeof global & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null }
}

const cache = globalWithMongoose.mongoose

export async function connectDB() {
  if (cache.conn) return cache.conn
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI).then(m => m)
  }
  cache.conn = await cache.promise
  return cache.conn
}
