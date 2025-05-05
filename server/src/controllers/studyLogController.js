const StudyLog = require('../models/StudyLog');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');

// Get all study logs for current user
exports.getUserStudyLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get study logs
    const studyLogs = await StudyLog.find({ userId })
      .populate('classId', 'name')
      .sort({ date: -1 });
      
    res.json(studyLogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get study logs summary for current user
exports.getUserStudyLogsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get classes the user is in
    const classes = await Class.find({ 
      $or: [
        { students: userId },
        { teacher: userId }
      ]
    });
    
    // Get study logs for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const studyLogs = await StudyLog.find({ 
      userId,
      date: { $gte: thirtyDaysAgo }
    })
    .populate('classId', 'name');
    
    // Calculate total time per subject
    const subjectTotals = {};
    const classTotals = {};
    
    studyLogs.forEach(log => {
      // Sum by subject
      if (!subjectTotals[log.subject]) {
        subjectTotals[log.subject] = 0;
      }
      subjectTotals[log.subject] += log.duration;
      
      // Sum by class
      const classId = log.classId._id.toString();
      if (!classTotals[classId]) {
        classTotals[classId] = {
          className: log.classId.name,
          totalMinutes: 0
        };
      }
      classTotals[classId].totalMinutes += log.duration;
    });
    
    // Calculate daily totals for the last 30 days
    const dailyTotals = {};
    const now = new Date();
    
    // Initialize all days with zero
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTotals[dateStr] = 0;
    }
    
    // Sum durations by day
    studyLogs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0];
      if (dailyTotals[dateStr] !== undefined) {
        dailyTotals[dateStr] += log.duration;
      }
    });
    
    // Convert to arrays for frontend charts
    const subjectData = Object.entries(subjectTotals).map(([subject, minutes]) => ({
      subject,
      minutes
    }));
    
    const classData = Object.values(classTotals);
    
    const dailyData = Object.entries(dailyTotals).map(([date, minutes]) => ({
      date,
      minutes
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      subjectData,
      classData,
      dailyData,
      totalMinutes: studyLogs.reduce((sum, log) => sum + log.duration, 0),
      totalSessions: studyLogs.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create a new study log
exports.createStudyLog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { classId, subject, date, duration, notes } = req.body;
    
    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ msg: 'Class not found' });
    }
    
    // Check if user is in the class
    const isTeacher = classExists.teacher.toString() === req.user.id;
    const isStudent = classExists.students.includes(req.user.id);
    
    if (!isTeacher && !isStudent) {
      return res.status(401).json({ msg: 'User not authorized to log study time for this class' });
    }
    
    // Create study log
    const newStudyLog = new StudyLog({
      userId: req.user.id,
      classId,
      subject,
      date: date || Date.now(),
      duration,
      notes
    });
    
    const studyLog = await newStudyLog.save();
    
    res.json(studyLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update study log
exports.updateStudyLog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { subject, date, duration, notes } = req.body;
    const logId = req.params.id;
    
    // Check if log exists and belongs to user
    const studyLog = await StudyLog.findOne({ 
      _id: logId,
      userId: req.user.id
    });
    
    if (!studyLog) {
      return res.status(404).json({ msg: 'Study log not found or not authorized' });
    }
    
    // Update fields
    if (subject) studyLog.subject = subject;
    if (date) studyLog.date = date;
    if (duration) studyLog.duration = duration;
    if (notes !== undefined) studyLog.notes = notes;
    
    await studyLog.save();
    
    res.json(studyLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete study log
exports.deleteStudyLog = async (req, res) => {
  try {
    const logId = req.params.id;
    
    // Check if log exists and belongs to user
    const studyLog = await StudyLog.findOne({ 
      _id: logId,
      userId: req.user.id
    });
    
    if (!studyLog) {
      return res.status(404).json({ msg: 'Study log not found or not authorized' });
    }
    
    await StudyLog.findByIdAndRemove(logId);
    
    res.json({ msg: 'Study log deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get class study statistics (for teachers)
exports.getClassStudyStatistics = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // Check if class exists and user is teacher
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({ msg: 'Class not found' });
    }
    
    if (classInfo.teacher.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the teacher can view class study statistics' });
    }
    
    // Get all student IDs
    const studentIds = classInfo.students;
    
    // Get study logs for all students in this class
    const studyLogs = await StudyLog.find({ 
      classId,
      userId: { $in: studentIds }
    })
    .populate('userId', 'name');
    
    // Calculate statistics per student
    const studentStats = {};
    
    studyLogs.forEach(log => {
      const studentId = log.userId._id.toString();
      const studentName = log.userId.name;
      
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          studentId,
          studentName,
          totalMinutes: 0,
          sessions: 0,
          subjectBreakdown: {}
        };
      }
      
      studentStats[studentId].totalMinutes += log.duration;
      studentStats[studentId].sessions += 1;
      
      // Track time per subject
      if (!studentStats[studentId].subjectBreakdown[log.subject]) {
        studentStats[studentId].subjectBreakdown[log.subject] = 0;
      }
      studentStats[studentId].subjectBreakdown[log.subject] += log.duration;
    });
    
    // Convert to array and calculate averages
    const studentsArray = Object.values(studentStats);
    
    // Calculate class averages
    const totalStudents = studentsArray.length;
    const totalClassMinutes = studentsArray.reduce((sum, student) => sum + student.totalMinutes, 0);
    const totalClassSessions = studentsArray.reduce((sum, student) => sum + student.sessions, 0);
    
    const classAverage = {
      averageMinutesPerStudent: totalStudents > 0 ? totalClassMinutes / totalStudents : 0,
      averageSessionsPerStudent: totalStudents > 0 ? totalClassSessions / totalStudents : 0,
      totalStudentsLogging: totalStudents,
      totalClassMinutes,
      totalClassSessions
    };
    
    res.json({
      students: studentsArray,
      classAverage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};