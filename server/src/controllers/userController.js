const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const fileService = require('../services/fileService');

/**
 * Get current logged in user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('找不到用戶', 404));
    }
    res.json(user);
  } catch (err) {
    logger.error(`獲取當前用戶時發生錯誤: ${err.message}`);
    next(err);
  }
};

/**
 * Get all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    logger.error(`Error fetching all users: ${err.message}`);
    next(err);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    res.json(user);
  } catch (err) {
    logger.error(`Error fetching user by ID: ${err.message}`);
    next(err);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, bio } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (bio) updateFields.bio = bio;
    
    // Check if email is being updated and if it's already in use
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ErrorResponse('Email already in use', 400));
      }
      updateFields.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user, message: 'Profile updated successfully' });
  } catch (err) {
    logger.error(`Error updating profile: ${err.message}`);
    next(err);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    // Send email notification about password change
    try {
      await emailService.sendPasswordChangeNotification(user.email);
    } catch (emailErr) {
      logger.error(`Failed to send password change email: ${emailErr.message}`);
      // Continue with the process even if email fails
    }

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error(`Error changing password: ${err.message}`);
    next(err);
  }
};

/**
 * Delete user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user.id) {
      return next(new ErrorResponse('Cannot delete your own account', 400));
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting user: ${err.message}`);
    next(err);
  }
};

/**
 * Update user role (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Don't allow admin to change their own role
    if (user._id.toString() === req.user.id) {
      return next(new ErrorResponse('Cannot change your own role', 400));
    }
    
    user.role = role;
    await user.save();
    
    res.json({ user, message: 'User role updated successfully' });
  } catch (err) {
    logger.error(`Error updating user role: ${err.message}`);
    next(err);
  }
};

/**
 * Request password reset email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security reasons
      return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // Set expire time - 30 minutes
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
      res.json({ message: 'Password reset email sent' });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      logger.error(`Password reset email failed: ${emailErr.message}`);
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    logger.error(`Password reset request error: ${err.message}`);
    next(err);
  }
};

/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    // Hash token from URL
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Find user with token and valid expiry
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }
    
    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Send notification about password reset
    try {
      await emailService.sendPasswordChangeNotification(user.email);
    } catch (emailErr) {
      logger.error(`Password reset notification email failed: ${emailErr.message}`);
      // Continue with the process even if email fails
    }
    
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    logger.error(`Password reset error: ${err.message}`);
    next(err);
  }
};

/**
 * Get all students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (err) {
    logger.error(`Error fetching students: ${err.message}`);
    next(err);
  }
};

/**
 * Get all teachers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (err) {
    logger.error(`Error fetching teachers: ${err.message}`);
    next(err);
  }
};

/**
 * Update user notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const { emailNotifications, pushNotifications } = req.body;
    const updateFields = {};
    
    if (emailNotifications !== undefined) {
      updateFields['notificationSettings.email'] = emailNotifications;
    }
    
    if (pushNotifications !== undefined) {
      updateFields['notificationSettings.push'] = pushNotifications;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ user, message: 'Notification settings updated successfully' });
  } catch (err) {
    logger.error(`Error updating notification settings: ${err.message}`);
    next(err);
  }
};

/**
 * Upload user avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return next(new ErrorResponse('Please upload a file', 400));
    }
    
    // Check file type
    const fileTypes = /jpeg|jpg|png/;
    const mimeType = fileTypes.test(req.file.mimetype);
    
    if (!mimeType) {
      return next(new ErrorResponse('Please upload an image file (jpeg, jpg, png)', 400));
    }
    
    // Check file size (limit to 1MB)
    if (req.file.size > 1000000) {
      return next(new ErrorResponse('File size should be less than 1MB', 400));
    }
    
    // Process and save the file
    const avatarUrl = await fileService.saveUserAvatar(req.file, req.user.id);
    
    // Update user profile with new avatar URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ 
      user, 
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (err) {
    logger.error(`Error uploading avatar: ${err.message}`);
    next(err);
  }
};

/**
 * Remove user avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // If user has an avatar, delete it from storage
    if (user.avatar) {
      await fileService.deleteUserAvatar(user.avatar);
    }
    
    // Update user to remove avatar reference
    user.avatar = null;
    await user.save();
    
    res.json({ 
      user: await User.findById(req.user.id).select('-password'), 
      message: 'Avatar removed successfully' 
    });
  } catch (err) {
    logger.error(`Error removing avatar: ${err.message}`);
    next(err);
  }
};