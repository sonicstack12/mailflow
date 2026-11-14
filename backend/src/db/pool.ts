import mongoose from "mongoose";
import { env } from "../config/env.js";

let isConnected = false;

export async function connectDb() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 50 });
    // Wait for connection to be fully ready
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve(undefined);
        return;
      }
      mongoose.connection.once('open', resolve);
      mongoose.connection.once('error', reject);
    });
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log("[db] connected to MongoDB");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[db] connection error:", error);
    throw error;
  }
}

export async function pingDb() {
  if (!isConnected) {
    await connectDb();
  }
  await mongoose.connection.db?.admin().ping();
}

export async function disconnectDb() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
