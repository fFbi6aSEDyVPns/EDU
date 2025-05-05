const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScheduleItemSchema = new Schema({
  dayOfWeek: {
    type: Number, // 0-6, 0 for Sunday, 1 for Monday, etc.
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  location: {
    type: String
  }
});

const ScheduleSchema = new Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  items: [ScheduleItemSchema],
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
ScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Schedule', ScheduleSchema);