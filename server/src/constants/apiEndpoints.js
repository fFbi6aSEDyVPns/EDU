// API Base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Auth Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  USER: '/auth/me',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password'
};

// Class Endpoints
export const CLASS_ENDPOINTS = {
  BASE: '/classes',
  CLASS: (id) => `/classes/${id}`,
  CLASS_STUDENTS: (id) => `/classes/${id}/students`,
  CLASS_ASSIGNMENTS: (id) => `/classes/${id}/assignments`
};

// Assignment Endpoints
export const ASSIGNMENT_ENDPOINTS = {
  BASE: '/assignments',
  ASSIGNMENT: (id) => `/assignments/${id}`,
  SUBMIT: (id) => `/assignments/${id}/submit`
};

// Schedule Endpoints
export const SCHEDULE_ENDPOINTS = {
  BASE: '/schedules',
  SCHEDULE: (id) => `/schedules/${id}`,
  USER_SCHEDULE: '/schedules/user'
};

// Study Log Endpoints
export const STUDY_LOG_ENDPOINTS = {
  BASE: '/study-logs',
  STUDY_LOG: (id) => `/study-logs/${id}`,
  USER_LOGS: '/study-logs/user',
  STATISTICS: '/study-logs/statistics'
};

// User Endpoints
export const USER_ENDPOINTS = {
  BASE: '/users',
  USER: (id) => `/users/${id}`,
  UPDATE_PROFILE: '/users/profile'
};

// Upload Endpoints
export const UPLOAD_ENDPOINTS = {
  BASE: '/uploads',
  FILE: (id) => `/uploads/${id}`
};