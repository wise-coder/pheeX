const mongoose = require("mongoose");

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error("MONGODB_URI is missing. Add your hosted MongoDB connection string in Render.");
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (/authentication failed/i.test(error.message)) {
      throw new Error("MongoDB authentication failed. Check your MONGODB_URI username and password.");
    }

    if (/ENOTFOUND|getaddrinfo/i.test(error.message)) {
      throw new Error("MongoDB host could not be reached. Check the cluster hostname in MONGODB_URI.");
    }

    if (/ECONNREFUSED/i.test(error.message)) {
      throw new Error("MongoDB connection was refused. Make sure you are using a hosted MongoDB URI, not localhost.");
    }

    if (/IP.*not allowed|whitelist/i.test(error.message)) {
      throw new Error("MongoDB blocked the connection. In MongoDB Atlas, allow Render in Network Access.");
    }

    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

module.exports = connectDatabase;
