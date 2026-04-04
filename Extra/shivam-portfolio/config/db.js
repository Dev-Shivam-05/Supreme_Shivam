const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
};

module.exports = connectDB;
