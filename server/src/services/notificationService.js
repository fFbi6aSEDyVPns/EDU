const { ErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_UPDATED: 'assignment_updated',
  ASSIGNMENT_DUE_SOON: 'assignment_due_soon',
  STUDY_REMINDER: 'study_reminder',
  CLASS_SCHEDULE_CHANGED: 'class_schedule_changed',
  NEW_CLASS_MATERIAL: 'new_class_material',
  GRADE_POSTED: 'grade_posted'
};

/**
 * Send notification based on type
 * @param {string} type - Notification type from NOTIFICATION_TYPES
 * @param {Object} data - Data required for the notification
 * @param {Array|Object} recipients - User(s) to receive notification
 * @returns {Promise<Object>} - Result of the notification
 */
const sendNotification = async (type, data, recipients) => {
  try {
    // Convert single recipient to array
    const users = Array.isArray(recipients) ? recipients : [recipients];
    
    // For each notification type, process the notification
    switch (type) {
      case NOTIFICATION_TYPES.ASSIGNMENT_CREATED:
        return Promise.all(users.map(user => emailService.sendAssignmentNotification({
          user,
          assignment: data
        })));
        
      case NOTIFICATION_TYPES.ASSIGNMENT_DUE_SOON:
        // Implement due soon reminder logic
        return Promise.all(users.map(user => emailService.sendEmail({
          to: user.email,
          subject: `Assignment Due Soon: ${data.title}`,
          text: `Remember: "${data.title}" is due on ${new Date(data.dueDate).toLocaleDateString()}`,
          html: `<p>Remember: <strong>${data.title}</strong> is due on ${new Date(data.dueDate).toLocaleDateString()}</p>`
        })));
        
      case NOTIFICATION_TYPES.STUDY_REMINDER:
        // Implement study reminder logic
        return Promise.all(users.map(user => emailService.sendEmail({
          to: user.email,
          subject: 'Study Reminder',
          text: `Don't forget to study ${data.subject} today!`,
          html: `<p>Don't forget to study <strong>${data.subject}</strong> today!</p>`
        })));
        
      // Add more notification types as needed
        
      default:
        throw new ErrorResponse(`Notification type ${type} not supported`, 400);
    }
  } catch (error) {
    logger.error(`Notification error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  sendNotification
};