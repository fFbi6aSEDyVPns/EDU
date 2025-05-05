const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const asyncHandler = require('../middlewares/async');

// Get all assignments for a class
exports.getClassAssignments = asyncHandler(async (req, res) => {
  const classId = req.params.classId;
  
  // Check if class exists
  const classExists = await Class.findById(classId);
  if (!classExists) {
    return res.status(404).json({ msg: 'Class not found' });
  }
  
  // Get assignments
  const assignments = await Assignment.find({ classId })
    .populate('createdBy', 'name')
    .sort({ dueDate: 1 });
    
  res.json(assignments);
});

// Get all assignments for a user
exports.getUserAssignments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get user class memberships
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }
  
  // Get assignments for classes the user is in
  const classes = await Class.find({ 
    $or: [
      { students: userId },
      { teacher: userId }
    ]
  });
  
  const classIds = classes.map(c => c._id);
  
  const assignments = await Assignment.find({ 
    classId: { $in: classIds } 
  })
  .populate('classId', 'name')
  .populate('createdBy', 'name')
  .sort({ dueDate: 1 });
  
  res.json(assignments);
});

// Create a new assignment
exports.createAssignment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { title, description, dueDate, classId } = req.body;
  
  // Check if class exists
  const classExists = await Class.findById(classId);
  if (!classExists) {
    return res.status(404).json({ msg: 'Class not found' });
  }
  
  // Check if user is teacher of the class
  if (classExists.teacher.toString() !== req.user.id) {
    return res.status(401).json({ msg: 'User not authorized to create assignments for this class' });
  }
  
  // Create assignment
  const newAssignment = new Assignment({
    title,
    description,
    dueDate,
    classId,
    createdBy: req.user.id
  });
  
  const assignment = await newAssignment.save();
  
  res.json(assignment);
});

// Update assignment
exports.updateAssignment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { title, description, dueDate, status } = req.body;
  const assignmentId = req.params.id;
  
  // Check if assignment exists
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ msg: 'Assignment not found' });
  }
  
  // Get class info
  const classInfo = await Class.findById(assignment.classId);
  if (!classInfo) {
    return res.status(404).json({ msg: 'Class not found' });
  }
  
  // Check if user is teacher of the class or created the assignment
  if (classInfo.teacher.toString() !== req.user.id && 
      assignment.createdBy.toString() !== req.user.id) {
    return res.status(401).json({ msg: 'User not authorized to update this assignment' });
  }
  
  // Update fields
  if (title) assignment.title = title;
  if (description) assignment.description = description;
  if (dueDate) assignment.dueDate = dueDate;
  if (status) assignment.status = status;
  
  await assignment.save();
  
  res.json(assignment);
});

// Delete assignment
exports.deleteAssignment = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;
  
  // Check if assignment exists
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ msg: 'Assignment not found' });
  }
  
  // Get class info
  const classInfo = await Class.findById(assignment.classId);
  if (!classInfo) {
    return res.status(404).json({ msg: 'Class not found' });
  }
  
  // Check if user is teacher of the class or created the assignment
  if (classInfo.teacher.toString() !== req.user.id && 
      assignment.createdBy.toString() !== req.user.id) {
    return res.status(401).json({ msg: 'User not authorized to delete this assignment' });
  }
  
  await Assignment.findByIdAndRemove(assignmentId);
  
  res.json({ msg: 'Assignment deleted' });
});

// Update assignment status (for students)
exports.updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const assignmentId = req.params.id;
  
  // Check if assignment exists
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ msg: 'Assignment not found' });
  }
  
  // Get class info
  const classInfo = await Class.findById(assignment.classId);
  if (!classInfo) {
    return res.status(404).json({ msg: 'Class not found' });
  }
  
  // Check if user is a student in the class
  if (!classInfo.students.includes(req.user.id)) {
    return res.status(401).json({ msg: 'User not authorized to update this assignment status' });
  }
  
  // Update status
  assignment.status = status;
  await assignment.save();
  
  res.json(assignment);
});
