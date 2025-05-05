const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middlewares/auth');
const studyLogController = require('../controllers/studyLogController');

// @route   GET /api/study-logs/user
// @desc    Get all study logs for current user
// @access  Private
router.get('/user', auth, studyLogController.getUserStudyLogs);

// @route   GET /api/study-logs/summary
// @desc    Get study logs summary for current user
// @access  Private
router.get('/summary', auth, studyLogController.getUserStudyLogsSummary);

// @route   GET /api/study-logs/class/:classId/statistics
// @desc    Get class study statistics (for teachers)
// @access  Private (teachers only)
router.get('/class/:classId/statistics', auth, studyLogController.getClassStudyStatistics);

// @route   POST /api/study-logs
// @desc    Create a new study log
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('classId', 'Class ID is required').not().isEmpty(),
      check('subject', 'Subject is required').not().isEmpty(),
      check('duration', 'Duration (in minutes) is required').isInt({ min: 1 })
    ]
  ],
  studyLogController.createStudyLog
);

// @route   PUT /api/study-logs/:id
// @desc    Update a study log
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('subject', 'Subject must be valid').optional(),
      check('duration', 'Duration must be a positive number').optional().isInt({ min: 1 }),
      check('date', 'Date must be valid').optional().isISO8601()
    ]
  ],
  studyLogController.updateStudyLog
);

// @route   DELETE /api/study-logs/:id
// @desc    Delete a study log
// @access  Private
router.delete('/:id', auth, studyLogController.deleteStudyLog);

module.exports = router;