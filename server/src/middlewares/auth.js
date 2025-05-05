const jwt = require('jsonwebtoken');
const User = require('../models/User');


// 保護路由，確保用戶已登入
module.exports.protect = async (req, res, next) => {
  let token;

  // 從 Authorization 標頭獲取 token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 檢查 token 是否存在
  if (!token) {
    return res.status(401).json({ message: '未授權：Token 缺失' });
  }

  try {
    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: '未授權：找不到用戶' });
    }

    // 僅傳需要的欄位給 req.user
    req.user = { id: user._id, role: user.role };

    next();
  } catch (error) {
    return res.status(401).json({ message: '未授權：Token 無效' });
  }
};

// 授權角色
module.exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `${req.user.role} 無權限訪問此資源`,
      });
    }
    next();
  };
};
