const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保護路由，確保用戶已登入
const protect = async (req, res, next) => {
  try {
    // 從 header 獲取 token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // 檢查是否有 token
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: '沒有權限，請先登入' });
    }

    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // 查找用戶
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: '無效的用戶' });
    }

    // 將用戶信息添加到請求對象
    req.user = user;
    next();
  } catch (err) {
    console.error('Error in auth middleware:', err);
    res.status(401).json({ 
      message: '無效的 token',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 授權角色
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log('Unauthorized role:', req.user.role);
      return res.status(403).json({
        message: `${req.user.role} 無權限訪問此資源`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
