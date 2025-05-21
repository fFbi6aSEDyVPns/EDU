const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth');
const User = require('../models/User');
const validate = require('../middlewares/validate');
const userController = require('../controllers/userController');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '找不到用戶' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '找不到用戶' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/users/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/update-profile', 
  protect,
  [
    check('name', '請輸入姓名').optional().notEmpty(),
    check('email', '請輸入有效的電子郵件').optional().isEmail(),
    check('phone', '請輸入有效的電話號碼').optional().isMobilePhone(),
    check('bio', '自我介紹不能超過500個字符').optional().isLength({ max: 500 })
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, phone, bio } = req.body;
      const user = await User.findById(req.user.id);
      
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (bio) user.bio = bio;

      await user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  protect,
  [
    check('currentPassword', '請輸入當前密碼').notEmpty(),
    check('newPassword', '請輸入至少6個字符的新密碼').isLength({ min: 6 }),
    check('confirmPassword', '密碼不匹配').custom((value, { req }) => value === req.body.newPassword)
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: '當前密碼不正確' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ message: '密碼已更新' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '找不到用戶' });
    }
    await user.remove();
    res.json({ message: '用戶已刪除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.put('/:id/role',
  protect,
  authorize('admin'),
  [
    check('role', '請選擇角色').isIn(['student', 'teacher', 'admin'])
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: '找不到用戶' });
      }
      user.role = req.body.role;
      await user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
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
 * @route   GET /api/users/role/students
 * @desc    Get all students
 * @access  Private/Teacher or Admin
 */
router.get('/role/students', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/users/role/teachers
 * @desc    Get all teachers
 * @access  Private/Admin
 */
router.get('/role/teachers', protect, authorize('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/users/update-notification-settings
 * @desc    Update user notification settings
 * @access  Private
 */
router.put('/update-notification-settings',
  protect,
  [
    check('emailNotifications', '電子郵件通知設置必須是布爾值').optional().isBoolean(),
    check('pushNotifications', '推送通知設置必須是布爾值').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const { emailNotifications, pushNotifications } = req.body;
      const user = await User.findById(req.user.id);
      
      if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
      if (pushNotifications !== undefined) user.pushNotifications = pushNotifications;

      await user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
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

/**
 * @route   POST /api/users
 * @desc    Register a user
 * @access  Public
 */
router.post(
  '/',
  [
    check('name', '請輸入姓名').not().isEmpty(),
    check('email', '請輸入有效的電子郵件').isEmail(),
    check('password', '請輸入至少6個字符的密碼').isLength({ min: 6 }),
    check('role', '請選擇角色').isIn(['student', 'teacher'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ message: '用戶已存在' });
      }

      user = new User({
        name,
        email,
        password,
        role
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
          expiresIn: '24h'
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
