const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Class name is a required field'],
    trim: true,
    maxlength: [50, '班級名稱不能超過50個字符']
  },
  description: {
    type: String,
    maxlength: [500, 'Class name cannot exceed 50 characters']
  },
  grade: {
    type: String,
    required: [true, 'Grade is a required field'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is a required field'],
    trim: true
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is a required field']
  },
  assistants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  students: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  courseSchedule: {
    type: mongoose.Schema.ObjectId,
    ref: 'Schedule',
    default: null
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虛擬屬性：學生人數
ClassSchema.virtual('studentCount').get(function() {
  return this.students.length;
});

// 索引以提高查詢效率
ClassSchema.index({ teacher: 1 });
ClassSchema.index({ grade: 1, academicYear: 1 });

// 在查詢中預載入教師和學生資訊的中間件
ClassSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'teacher',
    select: 'name email role'
  });
  next();
});

// 加載學生詳細資訊的方法
ClassSchema.methods.loadStudentsDetail = async function() {
  await this.populate({
    path: 'students',
    select: 'name email'
  }).execPopulate();
  return this;
}

module.exports = mongoose.model('Class', ClassSchema);