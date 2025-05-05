import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/routing/PrivateRoute';

// Public pages
import Landing from '../pages/Landing';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';

// Private pages
import Dashboard from '../pages/Dashboard';
import ClassList from '../pages/ClassList';
import ClassDetail from '../pages/ClassDetail';
import ClassForm from '../pages/ClassForm';
import Assignment from '../pages/Assignment';
import Schedule from '../pages/Schedule';
import StudyLogs from '../pages/StudyLogs';
import ManageStudent from '../pages/ManageStudent';

// Route config
import { ROUTES } from '../constants/routes';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LANDING} element={<Landing />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      
      {/* Private Routes */}
      <Route path={ROUTES.DASHBOARD} element={<PrivateRoute component={Dashboard} />} />
      
      {/* Class Routes */}
      <Route path={ROUTES.CLASSES} element={<PrivateRoute component={ClassList} />} />
      <Route path={`${ROUTES.CLASSES}/:id`} element={<PrivateRoute component={ClassDetail} />} />
      <Route path={ROUTES.CREATE_CLASS} element={<PrivateRoute component={ClassForm} />} />
      <Route path={`${ROUTES.EDIT_CLASS}/:id`} element={<PrivateRoute component={ClassForm} />} />
      
      {/* Assignment Routes */}
      <Route path={ROUTES.ASSIGNMENTS} element={<PrivateRoute component={Assignment} />} />
      
      {/* Schedule Routes */}
      <Route path={ROUTES.SCHEDULE} element={<PrivateRoute component={Schedule} />} />
      
      {/* Study Log Routes */}
      <Route path={ROUTES.STUDY_LOGS} element={<PrivateRoute component={StudyLogs} />} />
      
      {/* Student Management Routes */}
      <Route path={ROUTES.MANAGE_STUDENTS} element={<PrivateRoute component={ManageStudent} />} />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
    </Routes>
  );
};

export default AppRoutes;