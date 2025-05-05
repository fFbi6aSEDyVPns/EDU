const User = require('../models/User');

// @desc    註冊用戶
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;

    // 檢查是否已存在用戶
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exit' });
    }

    // 創建用戶
    const user = await User.create({
      username,
      name,
      email,
      password,
      role: role || 'student',
    });

    // 生成 token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sever Error' });
  }
};

// @desc    用戶登入
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 驗證輸入
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide ur username and password' });
    }

    // 查找用戶
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid certificate' });
    }

    // 檢查密碼
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid certificate' });
    }

    // 更新最後登入時間
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 生成 token
    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sever Error' });
  }
};

// @desc    獲取當前登入用戶
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sever Error' });
  }
};