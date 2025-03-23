import mongoose from "mongoose";

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Define global interface for connection caching
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: MongooseConnection | undefined;
}

// Connection function that handles caching
async function connectToDatabase(): Promise<typeof mongoose> {
  // Check if we have connection cache in the global object
  if (!global.mongooseConnection) {
    global.mongooseConnection = {
      conn: null,
      promise: null,
    };
  }

  // If we have an existing connection, return it
  if (global.mongooseConnection.conn) {
    return global.mongooseConnection.conn;
  }

  // If we're already connecting, return the promise
  if (!global.mongooseConnection.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Create new connection promise
    global.mongooseConnection.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => mongoose);
  }

  try {
    // Await the connection
    const mongoose = await global.mongooseConnection.promise;
    global.mongooseConnection.conn = mongoose;
    return mongoose;
  } catch (e) {
    global.mongooseConnection.promise = null;
    throw e;
  }
}

export default connectToDatabase;
