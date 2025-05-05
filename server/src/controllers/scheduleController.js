const Schedule = require('../models/Schedule');
const Class = require('../models/Class');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get schedule for a class
exports.getClassSchedule = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ msg: 'Class not found' });
    }
    
    // Get schedule
    let schedule = await Schedule.findOne({ classId })
      .populate('lastModifiedBy', 'name');
    
    if (!schedule) {
      schedule = { classId, items: [] }; // Return empty schedule if none exists
    }
      
    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create or update schedule
exports.updateSchedule = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { items } = req.body;
    const classId = req.params.classId;
    
    // Check if class exists
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({ msg: 'Class not found' });
    }
    
    // Only teacher or class monitor can update schedule
    const isTeacher = classInfo.teacher.toString() === req.user.id;
    const isClassMonitor = classInfo.classMonitor && 
                         classInfo.classMonitor.toString() === req.user.id;
    
    if (!isTeacher && !isClassMonitor) {
      return res.status(401).json({ 
        msg: 'Only the teacher or class monitor can update the schedule' 
      });
    }
    
    // Validate schedule items
    for (let item of items) {
      if (item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        return res.status(400).json({ msg: 'Day of week must be between 0 and 6' });
      }
      
      // Basic time format validation
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(item.startTime) || !timeRegex.test(item.endTime)) {
        return res.status(400).json({ msg: 'Time must be in HH:MM format' });
      }
    }
    
    // Find existing schedule or create new one
    let schedule = await Schedule.findOne({ classId });
    
    if (schedule) {
      schedule.items = items;
      schedule.lastModifiedBy = req.user.id;
    } else {
      schedule = new Schedule({
        classId,
        items,
        lastModifiedBy: req.user.id
      });
    }
    
    await schedule.save();
    
    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get schedules for all classes a user belongs to
exports.getUserSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user class memberships
    const classes = await Class.find({ 
      $or: [
        { students: userId },
        { teacher: userId }
      ]
    });
    
    const classIds = classes.map(c => c._id);
    
    // Get schedules for all classes
    const schedules = await Schedule.find({ 
      classId: { $in: classIds } 
    })
    .populate('classId', 'name')
    .populate('lastModifiedBy', 'name');
    
    // Create a map of class name to schedule for easier frontend consumption
    const result = schedules.map(schedule => {
      const classInfo = classes.find(c => c._id.toString() === schedule.classId._id.toString());
      return {
        classId: schedule.classId._id,
        className: schedule.classId.name,
        items: schedule.items,
        lastModifiedBy: schedule.lastModifiedBy,
        updatedAt: schedule.updatedAt
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a schedule item
exports.deleteScheduleItem = async (req, res) => {
  try {
    const { classId, itemId } = req.params;
    
    // Check if class exists
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({ msg: 'Class not found' });
    }
    
    // Only teacher or class monitor can update schedule
    const isTeacher = classInfo.teacher.toString() === req.user.id;
    const isClassMonitor = classInfo.classMonitor && 
                         classInfo.classMonitor.toString() === req.user.id;
    
    if (!isTeacher && !isClassMonitor) {
      return res.status(401).json({ 
        msg: 'Only the teacher or class monitor can update the schedule' 
      });
    }
    
    // Find schedule
    const schedule = await Schedule.findOne({ classId });
    if (!schedule) {
      return res.status(404).json({ msg: 'Schedule not found' });
    }
    
    // Remove the item
    schedule.items = schedule.items.filter(item => item._id.toString() !== itemId);
    schedule.lastModifiedBy = req.user.id;
    
    await schedule.save();
    
    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};