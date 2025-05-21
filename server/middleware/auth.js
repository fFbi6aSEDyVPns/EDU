const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// 保護路由
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: '未授權的訪問' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('解碼的 token:', decoded);

if (!decoded.user || !decoded.user.id) {
  console.error('無效的 token 結構:', decoded);
  return res.status(401).json({ success: false, message: '無效的 token' });
}

const user = await User.findById(decoded.user.id);
console.log('查詢到的用戶:', user);

if (!user) {
  console.error('用戶不存在:', decoded.user.id);
  return res.status(401).json({ success: false, message: '用戶不存在' });
}

req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '未授權的訪問' });
  }
});

// 授權角色
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `用戶角色 ${req.user.role} 未被授權訪問此路由`,
      });
    }
    next();
  };
}; 