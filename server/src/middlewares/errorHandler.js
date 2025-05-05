const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Format mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        errors: messages
      });
    }
  
    // Duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        errors: ['Duplicate field value entered']
      });
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        errors: ['Invalid token']
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        errors: ['Token expired']
      });
    }
  
    // Default error
    res.status(err.statusCode || 500).json({
      success: false,
      errors: [err.message || 'Server Error']
    });
  };
  
  module.exports = errorHandler;