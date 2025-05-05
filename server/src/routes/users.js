const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth'); // 引入 protect 和 authorize
const userController = require('../controllers/userController');
const validate  = require('../middlewares/validate');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, userController.getCurrentUser); // 修改為 /me 以符合慣例

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), userController.getAllUsers); // 使用 authorize('admin')

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', protect, userController.getUserById);

/**
 * @route   PUT /api/users/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/update-profile', 
    protect,
  [
    check('name', 'Name is required').optional().notEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('phone', 'Please enter a valid phone number').optional().isMobilePhone(),
    check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 })
  ],
  validate,
  userController.updateProfile
);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  protect, // 使用 protect 而非 auth
  [
    check('currentPassword', 'Current password is required').notEmpty(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('confirmPassword', 'Passwords must match').custom((value, { req }) => value === req.body.newPassword)
  ],
  validate,
  userController.changePassword
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), userController.deleteUser); // 使用 authorize('admin')

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.put('/:id/role',
  protect, // 使用 protect 而非 auth
  authorize('admin'), // 使用 authorize('admin') 確保只有 admin 可以更新角色
  [
    check('role', 'Role is required').isIn(['student', 'teacher', 'admin'])
  ],
  validate,
  userController.updateUserRole
);

/**
 * @route   POST /api/users/request-password-reset
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/request-password-reset',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  validate,
  userController.requestPasswordReset
);

/**
 * @route   POST /api/users/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  [
    check('token', 'Token is required').notEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('confirmPassword', 'Passwords must match').custom((value, { req }) => value === req.body.password)
  ],
  validate,
  userController.resetPassword
);

/**
 * @route   GET /api/users/students
 * @desc    Get all students
 * @access  Private/Teacher or Admin
 */
router.get('/role/students', protect, authorize('teacher', 'admin'), userController.getStudents); // 確保 Teacher 或 Admin 才能訪問

/**
 * @route   GET /api/users/teachers
 * @desc    Get all teachers
 * @access  Private/Admin
 */
router.get('/role/teachers', protect, authorize('admin'), userController.getTeachers); // 只允許 Admin 訪問

/**
 * @route   PUT /api/users/update-notification-settings
 * @desc    Update user notification settings
 * @access  Private
 */
router.put('/update-notification-settings',
  protect, // 使用 protect 而非 auth
  [
    check('emailNotifications', 'Email notifications setting must be boolean').optional().isBoolean(),
    check('pushNotifications', 'Push notifications setting must be boolean').optional().isBoolean()
  ],
  validate,
  userController.updateNotificationSettings
);

/**
 * @route   POST /api/users/upload-avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/upload-avatar', protect, userController.uploadAvatar);

/**
 * @route   DELETE /api/users/remove-avatar
 * @desc    Remove user avatar
 * @access  Private
 */
router.delete('/remove-avatar', protect, userController.removeAvatar);


module.exports = router;
