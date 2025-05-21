const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    註冊用戶
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: '用戶已存在' });
    }

    user = new User({
      name,
      email,
      password
    });

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    登入用戶
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ msg: '無效的憑證' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ msg: '無效的憑證' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    console.log('生成 token 的 payload:', payload);

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('生成 token 錯誤:', err);
          throw err;
        }
        console.log('生成的 token:', token);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('登入錯誤:', err);
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    獲取當前用戶
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('getMe - 請求用戶:', req.user);
    
    if (!req.user || !req.user.id) {
      console.error('getMe - 未找到用戶信息');
      return res.status(401).json({ success: false, message: '未授權的訪問' });
    }

    const user = await User.findById(req.user.id).select('-password');
    console.log('getMe - 查詢到的用戶:', user);
    
    if (!user) {
      console.error('getMe - 用戶不存在');
      return res.status(404).json({ success: false, message: '用戶不存在' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('getMe - 錯誤:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// @desc    更新用戶資料
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
}; 