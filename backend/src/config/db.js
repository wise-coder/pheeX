const mongoose = require("mongoose");

const connectDatabase = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDatabase;
