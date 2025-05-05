const fs = require('fs');
const path = require('path');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const { ErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');

// Convert fs functions to promises
const unlinkAsync = util.promisify(fs.unlink);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

const uploadDir = path.join(__dirname, '../../uploads');

/**
 * Save a file to disk
 * @param {Object} file - File object from multer
 * @param {string} subdirectory - Optional subdirectory within uploads
 * @returns {Promise<string>} - Path to the saved file
 */
const saveFile = async (file, subdirectory = '') => {
  try {
    if (!file) {
      throw new ErrorResponse('No file provided', 400);
    }

    const targetDir = subdirectory ? path.join(uploadDir, subdirectory) : uploadDir;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // File is already saved by multer, just return path
    return file.path;
  } catch (error) {
    logger.error(`File save error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a file from disk
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (filePath) => {
  try {
    if (!filePath) {
      throw new ErrorResponse('No file path provided', 400);
    }

    // Check if file exists
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    } else {
      logger.warn(`File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    logger.error(`File delete error: ${error.message}`);
    throw error;
  }
};

/**
 * Get file information
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - File information
 */
const getFileInfo = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new ErrorResponse('File not found', 404);
    }

    const stats = await statAsync(filePath);
    const fileExt = path.extname(filePath);
    const fileName = path.basename(filePath);

    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      extension: fileExt,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime
    };
  } catch (error) {
    logger.error(`Get file info error: ${error.message}`);
    throw error;
  }
};

/**
 * List files in a directory
 * @param {string} subdirectory - Subdirectory within uploads
 * @returns {Promise<Array>} - List of files
 */
const listFiles = async (subdirectory = '') => {
  try {
    const targetDir = subdirectory ? path.join(uploadDir, subdirectory) : uploadDir;
    
    if (!fs.existsSync(targetDir)) {
      return [];
    }

    const files = await readdirAsync(targetDir);
    const fileInfoPromises = files.map(async (file) => {
      const filePath = path.join(targetDir, file);
      const stats = await statAsync(filePath);
      
      if (stats.isFile()) {
        return {
          name: file,
          path: filePath,
          size: stats.size,
          extension: path.extname(file),
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        };
      }
      return null;
    });

    const fileInfos = await Promise.all(fileInfoPromises);
    return fileInfos.filter(Boolean); // Remove null entries (directories)
  } catch (error) {
    logger.error(`List files error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  saveFile,
  deleteFile,
  getFileInfo,
  listFiles
};