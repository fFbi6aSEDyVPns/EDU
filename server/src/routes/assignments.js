const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth');
const assignmentController = require('../controllers/assignmentController');

// @route   GET /api/assignments/class/:classId
// @desc    Get all assignments for a class
// @access  Private
router.get('/class/:classId', protect, assignmentController.getClassAssignments);

// @route   GET /api/assignments/user
// @desc    Get all assignments for current user
// @access  Private
router.get('/user', protect, assignmentController.getUserAssignments);

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (teachers only)
router.post(
  '/',
  [
    protect,
    authorize('teacher'),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('dueDate', 'Due date is required').not().isEmpty(),
      check('classId', 'Class ID is required').not().isEmpty()
    ]
  ],
  assignmentController.createAssignment
);

// @route   PUT /api/assignments/:id
// @desc    Update an assignment
// @access  Private (teacher or creator only)
router.put(
  '/:id',
  [
    protect,
    [
      check('title', 'Title is required when updating').optional(),
      check('dueDate', 'Due date must be valid').optional().isISO8601(),
      check('status', 'Status must be valid').optional().isIn(['pending', 'completed', 'overdue'])
    ]
  ],
  assignmentController.updateAssignment
);

// @route   PUT /api/assignments/status/:id
// @desc    Update assignment status (for students)
// @access  Private (students only)
router.put(
  '/status/:id',
  [
    protect,
    authorize('student'),
    [
      check('status', 'Status is required').not().isEmpty().isIn(['pending', 'completed'])
    ]
  ],
  assignmentController.updateAssignmentStatus
);

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment
// @access  Private (teacher or creator only)
router.delete('/:id', protect, assignmentController.deleteAssignment);

module.exports = router;
