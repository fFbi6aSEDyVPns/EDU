const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// 載入環境變數
dotenv.config();

// 連接資料庫
connectDB();

const app = express();

// 中間件
app.use(express.json());
app.use(cors());

// 路由
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/classes', require('./routes/classes'));

// 錯誤處理中間件
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
}); 