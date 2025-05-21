const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI 未設置');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info(`MongoDB 已連接: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`資料庫連接錯誤: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;