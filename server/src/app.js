const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');



// 載入環境變數
require('dotenv').config();

// 連接資料庫
connectDB();

const app = express();

// 中間件
app.use(helmet()); // 安全性增強
app.use(cors()); // 允許跨域請求
app.use(express.json()); // JSON 解析
app.use(morgan('dev')); // HTTP 請求記錄

// 靜態檔案
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 基本路由
app.get('/', (req, res) => {
  res.send('API working!');
});

// 路由模組 (將在後續步驟中實現)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users.js'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/study-logs', require('./routes/studyLogs'));

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'sever error！' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`sever runs at port ${PORT}`);
});