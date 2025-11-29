import mongoose from "mongoose";

const MONGO_CONNECTION_STATES = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
};

export default async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI");
  }

  const currentState = mongoose.connection.readyState;

  // If already connected, return immediately
  if (currentState === MONGO_CONNECTION_STATES.connected) {
    return;
  }

  // If currently connecting, wait for the connection to complete
  if (currentState === MONGO_CONNECTION_STATES.connecting) {
    console.log("MongoDB: Connection already in progress, waiting...");
    // Wait for connection to complete (max 10 seconds)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("MongoDB connection timeout"));
      }, 10000);

      mongoose.connection.once("connected", () => {
        clearTimeout(timeout);
        resolve();
      });

      mongoose.connection.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return;
  }

  // If disconnecting, wait briefly and retry
  if (currentState === MONGO_CONNECTION_STATES.disconnecting) {
    console.log("MongoDB: Waiting for disconnection to complete...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Recursively call to retry connection
    return connectDB();
  }

  // Otherwise, establish a new connection
  try {
    console.log("MongoDB: Establishing new connection...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s default
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("MongoDB: Connected successfully");
  } catch (error) {
    console.error("MongoDB: Connection failed:", error.message);
    throw error;
  }
}
