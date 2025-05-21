const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  enrollClass,
  leaveClass
} = require('../controllers/classController');

// 所有路由都需要保護
router.use(protect);

// @route   GET /api/v1/classes
// @desc    獲取所有課程
// @access  Private
router.get('/', getClasses);

// @route   GET /api/v1/classes/:id
// @desc    獲取單個課程
// @access  Private
router.get('/:id', getClass);

// @route   POST /api/v1/classes
// @desc    創建課程
// @access  Private/Teacher
router.post(
  '/',
  [
    authorize('teacher', 'admin'),
    [
      check('title', '請輸入課程標題').not().isEmpty(),
      check('description', '請輸入課程描述').not().isEmpty(),
      check('category', '請選擇課程類別').not().isEmpty()
    ]
  ],
  createClass
);

// @route   PUT /api/v1/classes/:id
// @desc    更新課程
// @access  Private/Teacher
router.put('/:id', authorize('teacher', 'admin'), updateClass);

// @route   DELETE /api/v1/classes/:id
// @desc    刪除課程
// @access  Private/Teacher
router.delete('/:id', authorize('teacher', 'admin'), deleteClass);

// @route   POST /api/v1/classes/:id/enroll
// @desc    報名課程
// @access  Private/Student
router.post('/:id/enroll', authorize('student'), enrollClass);

// @route   POST /api/v1/classes/:id/leave
// @desc    退出課程
// @access  Private/Student
router.post('/:id/leave', authorize('student'), leaveClass);

module.exports = router; 