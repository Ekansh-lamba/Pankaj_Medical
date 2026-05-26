const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.error('MongoDB Connection Error: MONGO_URI / MONGODB_URI env var is not set.');
      return; // don't crash — routes still need to serve requests
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do NOT call process.exit(1) — let the server stay alive and retry on the next request
    // Mongoose will auto-retry the connection in the background
  }
};

module.exports = connectDB;
