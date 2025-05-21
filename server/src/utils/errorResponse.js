/**
 * Custom error class for API responses
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} [additionalInfo] - Any additional error information
 * @returns {Object} Formatted error object
 */
const formatError = (message, statusCode, additionalInfo = {}) => {
  return {
    success: false,
    status: statusCode,
    message,
    ...additionalInfo
  };
};

module.exports = {
  ErrorResponse,
  formatError
};