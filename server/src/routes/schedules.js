const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth');
const scheduleController = require('../controllers/scheduleController');

// @route   GET /api/schedules/class/:classId
// @desc    Get schedule for a class
// @access  Private
router.get('/class/:classId', protect, scheduleController.getClassSchedule);

// @route   GET /api/schedules/user
// @desc    Get schedules for all classes a user belongs to
// @access  Private
router.get('/user', protect, scheduleController.getUserSchedules);

// @route   PUT /api/schedules/class/:classId
// @desc    Update class schedule
// @access  Private (teacher or class monitor only)
router.put(
  '/class/:classId',
  [
    protect,
    authorize('teacher'),
    [
      check('items', 'Schedule items are required').isArray(),
      check('items.*.dayOfWeek', 'Day of week is required').isInt({ min: 0, max: 6 }),
      check('items.*.startTime', 'Start time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      check('items.*.endTime', 'End time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      check('items.*.subject', 'Subject is required').not().isEmpty()
    ]
  ],
  scheduleController.updateSchedule
);

// @route   DELETE /api/schedules/class/:classId/item/:itemId
// @desc    Delete a schedule item
// @access  Private (teacher or class monitor only)
router.delete('/class/:classId/item/:itemId', protect, authorize('teacher'), scheduleController.deleteScheduleItem);

module.exports = router;