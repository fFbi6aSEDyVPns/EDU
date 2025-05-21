const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '請輸入課程標題'],
    trim: true,
    maxlength: [100, '標題不能超過 100 個字元']
  },
  description: {
    type: String,
    required: [true, '請輸入課程描述'],
    maxlength: [500, '描述不能超過 500 個字元']
  },
  category: {
    type: String,
    required: [true, '請選擇課程類別'],
    enum: ['程式設計', '數學', '語言', '藝術', '其他']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', ClassSchema); 