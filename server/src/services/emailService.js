const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter object
let transporter;

if (process.env.NODE_ENV === 'production') {
  // Production configuration
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development configuration using Ethereal
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.DEV_EMAIL_PASS || 'ethereal_password'
    }
  });
}

/**
 * Send email
 * @param {Object} options Email options
 * @param {string} options.to Recipient email
 * @param {string} options.subject Email subject
 * @param {string} options.text Plain text content
 * @param {string} [options.html] HTML content
 * @returns {Promise<Object>} Email send info
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    
    return info;
  } catch (error) {
    logger.error(`Email error: ${error.message}`);
    throw error;
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user User information
 * @param {string} user.email User email
 * @param {string} user.name User name
 * @returns {Promise<Object>} Email send info
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to the Learning Management System',
    text: `Hi ${user.name},\n\nWelcome to our Learning Management System! We're excited to have you on board.\n\nBest regards,\nThe LMS Team`,
    html: `
      <h2>Welcome to our Learning Management System!</h2>
      <p>Hi ${user.name},</p>
      <p>We're excited to have you on board. Here are some quick tips to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Browse available classes</li>
        <li>Check the schedule</li>
        <li>Track your study progress</li>
      </ul>
      <p>If you have any questions, feel free to contact us.</p>
      <p>Best regards,<br>The LMS Team</p>
    `
  });
};

/**
 * Send assignment notification to student
 * @param {Object} data Notification data
 * @param {Object} data.user User information
 * @param {Object} data.assignment Assignment information
 * @returns {Promise<Object>} Email send info
 */
const sendAssignmentNotification = async (data) => {
  const { user, assignment } = data;
  const dueDate = new Date(assignment.dueDate).toLocaleDateString();
  
  return sendEmail({
    to: user.email,
    subject: `New Assignment: ${assignment.title}`,
    text: `Hi ${user.name},\n\nA new assignment "${assignment.title}" has been posted. It is due on ${dueDate}.\n\nDescription: ${assignment.description}\n\nBest regards,\nThe LMS Team`,
    html: `
      <h2>New Assignment Posted</h2>
      <p>Hi ${user.name},</p>
      <p>A new assignment has been posted to your class.</p>
      <div style="padding: 15px; border-left: 4px solid #0066cc; margin: 15px 0;">
        <h3>${assignment.title}</h3>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p><strong>Description:</strong> ${assignment.description}</p>
      </div>
      <p>Please log in to the system to view the full details and submit your work.</p>
      <p>Best regards,<br>The LMS Team</p>
    `
  });
};

/**
 * Send password reset email
 * @param {Object} data Reset data
 * @param {Object} data.user User information
 * @param {string} data.resetToken Reset token
 * @param {string} data.resetUrl Reset URL
 * @returns {Promise<Object>} Email send info
 */
const sendPasswordResetEmail = async (data) => {
  const { user, resetToken, resetUrl } = data;
  
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    text: `Hi ${user.name},\n\nYou requested to reset your password. Please use the following link to reset your password: ${resetUrl}\n\nThis link is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe LMS Team`,
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password. Please click the button below to reset your password:</p>
      <p>
        <a href="${resetUrl}" style="background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>This link is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The LMS Team</p>
    `
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAssignmentNotification,
  sendPasswordResetEmail
};