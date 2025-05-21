const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');

// @route   POST /api/v1/auth/register
// @desc    註冊用戶
// @access  Public
router.post(
  '/register',
  [
    check('name', '請輸入姓名').not().isEmpty(),
    check('email', '請輸入有效的電子郵件').isEmail(),
    check('password', '請輸入至少6個字符的密碼').isLength({ min: 6 })
  ],
  register
);

// @route   POST /api/v1/auth/login
// @desc    登入用戶
// @access  Public
router.post(
  '/login',
  [
    check('email', '請輸入有效的電子郵件').isEmail(),
    check('password', '密碼是必需的').exists()
  ],
  login
);

// @route   GET /api/v1/auth/me
// @desc    獲取當前用戶
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/v1/auth/profile
// @desc    更新用戶資料
// @access  Private
router.put('/profile', protect, updateProfile);

module.exports = router; 