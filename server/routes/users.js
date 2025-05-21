const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// 所有路由都需要保護
router.use(protect);

// 只有管理員可以訪問這些路由
router.use(authorize('admin'));

// @route   GET /api/v1/users
// @desc    獲取所有用戶
// @access  Private/Admin
router.get('/', getUsers);

// @route   GET /api/v1/users/:id
// @desc    獲取單個用戶
// @access  Private/Admin
router.get('/:id', getUser);

// @route   POST /api/v1/users
// @desc    創建用戶
// @access  Private/Admin
router.post(
  '/',
  [
    check('name', '請輸入姓名').not().isEmpty(),
    check('email', '請輸入有效的電子郵件').isEmail(),
    check('password', '請輸入至少6個字符的密碼').isLength({ min: 6 }),
    check('role', '請選擇有效的角色').isIn(['student', 'teacher', 'admin'])
  ],
  createUser
);

// @route   PUT /api/v1/users/:id
// @desc    更新用戶
// @access  Private/Admin
router.put('/:id', updateUser);

// @route   DELETE /api/v1/users/:id
// @desc    刪除用戶
// @access  Private/Admin
router.delete('/:id', deleteUser);

module.exports = router; 