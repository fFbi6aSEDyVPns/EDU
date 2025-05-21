const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middlewares/auth');
const User = require('../models/User');

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // 用戶信息已經在 middleware 中獲取並添加到 req.user
    res.json(req.user);
  } catch (err) {
    console.error('Error in GET /api/auth:', err);
    res.status(500).json({ 
      message: '伺服器錯誤',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST api/auth
// @desc    Auth user & get token
// @access  Public
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    // 使用 select('+password') 來包含密碼字段
    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: '無效的憑證' });
    }

    // 使用 User 模型的 matchPassword 方法
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: '無效的憑證' });
    }

    console.log('Login successful for user:', user.id);
    
    // 更新最後登入時間
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 使用 User 模型的 getSignedJwtToken 方法
    const token = user.getSignedJwtToken();

    res.json({ 
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in POST /api/auth:', err);
    res.status(500).json({ 
      message: '伺服器錯誤',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 檢查必填字段
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: '請填寫所有必填字段',
        errors: ['姓名、電子郵件和密碼為必填項']
      });
    }

    // 檢查是否已存在用戶
    let user = await User.findOne({ 
      $or: [
        { email },
        { username: email.split('@')[0] } // 使用電子郵件的前綴作為用戶名
      ]
    });
    
    if (user) {
      return res.status(400).json({ 
        message: '註冊失敗',
        errors: ['該電子郵件已被註冊']
      });
    }

    // 創建新用戶
    user = new User({
      username: email.split('@')[0], // 使用電子郵件的前綴作為用戶名
      name,
      email,
      password,
      role: role || 'student'
    });

    // 保存用戶（密碼會在 User 模型的 pre save 中間件中自動加密）
    await user.save();

    // 生成 JWT
    const payload = {
      id: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT 簽名錯誤:', err);
          throw err;
        }
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('註冊錯誤:', err);
    res.status(500).json({ 
      message: '註冊失敗',
      errors: [err.message]
    });
  }
});

module.exports = router;