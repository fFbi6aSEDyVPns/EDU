const { check } = require('express-validator');

// User validators
const userValidators = {
  register: [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty().isIn(['student', 'teacher', 'admin'])
  ],
  login: [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  updateUser: [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail()
  ]
};

// Class validators
const classValidators = {
  create: [
    check('name', 'Class name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('subject', 'Subject is required').not().isEmpty()
  ],
  update: [
    check('name', 'Class name is required').optional().not().isEmpty(),
    check('description', 'Description is required').optional().not().isEmpty(),
    check('subject', 'Subject is required').optional().not().isEmpty()
  ]
};

// Assignment validators
const assignmentValidators = {
  create: [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('classId', 'Class ID is required').not().isEmpty(),
    check('dueDate', 'Due date is required').isISO8601().toDate()
  ],
  update: [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('description', 'Description is required').optional().not().isEmpty(),
    check('dueDate', 'Due date must be a valid date').optional().isISO8601().toDate()
  ]
};

// Study log validators
const studyLogValidators = {
  create: [
    check('subject', 'Subject is required').not().isEmpty(),
    check('duration', 'Duration must be a positive number').isInt({ min: 1 }),
    check('date', 'Date is required').isISO8601().toDate(),
    check('notes', 'Notes are required').not().isEmpty()
  ],
  update: [
    check('subject', 'Subject is required').optional().not().isEmpty(),
    check('duration', 'Duration must be a positive number').optional().isInt({ min: 1 }),
    check('date', 'Date must be a valid date').optional().isISO8601().toDate()
  ]
};

// Schedule validators
const scheduleValidators = {
  create: [
    check('title', 'Title is required').not().isEmpty(),
    check('startTime', 'Start time is required').isISO8601().toDate(),
    check('endTime', 'End time is required').isISO8601().toDate(),
    check('classId', 'Class ID is required').optional()
  ],
  update: [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('startTime', 'Start time must be a valid date').optional().isISO8601().toDate(),
    check('endTime', 'End time must be a valid date').optional().isISO8601().toDate()
  ]
};

module.exports = {
  userValidators,
  classValidators,
  assignmentValidators,
  studyLogValidators,
  scheduleValidators
};