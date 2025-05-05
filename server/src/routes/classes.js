const express = require('express');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  addStudents,
  removeStudent,
  getClassStudents
} = require('../controllers/classController');

const router = express.Router();

// 引入保護路由和角色授權中間件
const { protect, authorize } = require('../middlewares/auth');

// 所有路由都需要認證
router.use(protect);

// 班級學生管理路由
router.route('/:id/students')
  .get(getClassStudents)
  .put(authorize('admin', 'teacher'), addStudents);

router.route('/:id/students/:studentId')
  .delete(authorize('admin', 'teacher'), removeStudent);

// 班級路由
router.route('/')
  .get(getClasses)
  .post(authorize('admin', 'teacher'), createClass);

router.route('/:id')
  .get(getClass)
  .put(authorize('admin', 'teacher'), updateClass)
  .delete(authorize('admin', 'teacher'), deleteClass);

module.exports = router;