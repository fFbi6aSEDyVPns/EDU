const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${message} ${stack || ''}`;
  })
);

// Define log transports
const transports = [
  // Write all logs with level 'error' and below to error.log
  new winston.transports.File({ 
    filename: path.join(logDir, 'error.log'), 
    level: 'error' 
  }),
  // Write all logs to combined.log
  new winston.transports.File({ 
    filename: path.join(logDir, 'combined.log') 
  })
];

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Create stream for Morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;