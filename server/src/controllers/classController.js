const Class = require('../models/Class');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

// @desc    獲取所有班級
// @route   GET /api/v1/classes
// @access  Private
exports.getClasses = asyncHandler(async (req, res, next) => {
  let query;
  
  // 複製 req.query
  const reqQuery = { ...req.query };
  
  // 排除特定字段
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);
  
  // 基於用戶角色過濾結果
  if (req.user.role === 'teacher') {
    // 教師只能看到自己的班級
    reqQuery.teacher = req.user.id;
  } else if (req.user.role === 'student') {
    // 學生只能看到自己所在的班級
    // 需要使用不同的查詢方式
    query = Class.find({ students: req.user.id });
  } 
  
  // 創建查詢字符串
  let queryStr = JSON.stringify(reqQuery);
  
  // 創建操作符 ($gt, $gte 等)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // 查找班級 (如果student查詢已設置，使用該查詢)
  query = query || Class.find(JSON.parse(queryStr));
  
  // 選擇特定字段
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // 排序
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // 分頁
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Class.countDocuments(
    req.user.role === 'student' ? { students: req.user.id } : JSON.parse(queryStr)
  );
  
  query = query.skip(startIndex).limit(limit);
  
  // 執行查詢
  const classes = await query;
  
  // 分頁結果
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: classes.length,
    pagination,
    data: classes
  });
});

// @desc    獲取單個班級
// @route   GET /api/v1/classes/:id
// @access  Private
exports.getClass = asyncHandler(async (req, res, next) => {
  const classItem = await Class.findById(req.params.id);
  
  if (!classItem) {
    return next(new ErrorResponse(`Cant find ID is${req.params.id}Class`, 404));
  }
  
  // 確保用戶有權限訪問此班級
  if (req.user.role !== 'admin' && 
      req.user.id !== classItem.teacher.toString() && 
      !classItem.students.includes(req.user.id)) {
    return next(new ErrorResponse(`User${req.user.id}do not have permission to access this class`, 403));
  }
  
  res.status(200).json({
    success: true,
    data: classItem
  });
});

// @desc    創建班級
// @route   POST /api/v1/classes
// @access  Private (只有教師和管理員)
exports.createClass = asyncHandler(async (req, res, next) => {
  // 僅允許教師和管理員創建班級
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return next(new ErrorResponse(`User role ${req.user.role}do not have permission to create a class`, 403));
  }
  
  // 如果是教師，自動設置為班級教師
  if (req.user.role === 'teacher') {
    req.body.teacher = req.user.id;
  }
  
  const classItem = await Class.create(req.body);
  
  res.status(201).json({
    success: true,
    data: classItem
  });
});

// @desc    更新班級
// @route   PUT /api/v1/classes/:id
// @access  Private (只有班級教師和管理員)
exports.updateClass = asyncHandler(async (req, res, next) => {
  let classItem = await Class.findById(req.params.id);
  
  if (!classItem) {
    return next(new ErrorResponse(`Can not find ID is${req.params.id}Class`, 404));
  }
  
  // 確保用戶是管理員或者班級教師
  if (req.user.role !== 'admin' && req.user.id !== classItem.teacher.toString()) {
    return next(new ErrorResponse(`User${req.user.id}do not have permission to update this class`, 403));
  }
  
  classItem = await Class.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: classItem
  });
});

// @desc    刪除班級
// @route   DELETE /api/v1/classes/:id
// @access  Private (只有班級教師和管理員)
exports.deleteClass = asyncHandler(async (req, res, next) => {
  const classItem = await Class.findById(req.params.id);
  
  if (!classItem) {
    return next(new ErrorResponse(`Can not find ID is${req.params.id}Class`, 404));
  }
  
  // 確保用戶是管理員或者班級教師
  if (req.user.role !== 'admin' && req.user.id !== classItem.teacher.toString()) {
    return next(new ErrorResponse(`User${req.user.id}do not have permission to delete this class`, 403));
  }
  
  await classItem.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    將學生添加到班級
// @route   PUT /api/v1/classes/:id/students
// @access  Private (只有班級教師和管理員)
exports.addStudents = asyncHandler(async (req, res, next) => {
  const classItem = await Class.findById(req.params.id);
  
  if (!classItem) {
    return next(new ErrorResponse(`Can not find ID is${req.params.id}Class`, 404));
  }
  
  // 確保用戶是管理員或者班級教師
  if (req.user.role !== 'admin' && req.user.id !== classItem.teacher.toString()) {
    return next(new ErrorResponse(`User${req.user.id}do not have permission to chage this class's students`, 403));
  }
  
  // 檢查請求體中的學生ID列表
  if (!req.body.students || !Array.isArray(req.body.students)) {
    return next(new ErrorResponse('Please provide the list of student IDs to add', 400));
  }
  
  // 確認所有學生ID都存在且角色為student
  const studentIds = req.body.students;
  const students = await User.find({ 
    _id: { $in: studentIds },
    role: 'student'
  });
  
  if (students.length !== studentIds.length) {
    return next(new ErrorResponse('Some student IDs are invalid or not of the student role', 400));
  }
  
  // 添加學生到班級 (避免重複)
  for (const studentId of studentIds) {
    if (!classItem.students.includes(studentId)) {
      classItem.students.push(studentId);
    }
  }
  
  await classItem.save();
  
  // 載入學生詳細信息以返回
  await classItem.loadStudentsDetail();
  
  res.status(200).json({
    success: true,
    data: classItem
  });
});

// @desc    從班級移除學生
// @route   DELETE /api/v1/classes/:id/students/:studentId
// @access  Private (只有班級教師和管理員)
exports.removeStudent = asyncHandler(async (req, res, next) => {
  const classItem = await Class.findById(req.params.id);
  
  if (!classItem) {
    return next(new ErrorResponse(`Can not find ID is${req.params.id}Class`, 404));
  }
  
  // 確保用戶是管理員或者班級教師
  if (req.user.role !== 'admin' && req.user.id !== classItem.teacher.toString()) {
    return next(new ErrorResponse(`User${req.user.id}do not have permission to chage this class's students`, 403));
  }
  
  // 檢查學生是否在班級中
  const studentIndex = classItem.students.indexOf(req.params.studentId);
  if (studentIndex === -1) {
    return next(new ErrorResponse(`The student is not in this class`, 404));
  }
  
  // 移除學生
  classItem.students.splice(studentIndex, 1);
  await classItem.save();
  
  res.status(200).json({
    success: true,
    data: classItem
  });
});

// @desc    獲取班級學生列表
// @route   GET /api/v1/classes/:id/students
// @access  Private
exports.getClassStudents = asyncHandler(async (req, res, next) => {
  const classItem = await Class.findById(req.params.id);
  
  if (!classItem) {
    return next(new ErrorResponse(`Can not find ID is${req.params.id}Class`, 404));
  }
  
  // 確保用戶有權限訪問此班級
  if (req.user.role !== 'admin' && 
      req.user.id !== classItem.teacher.toString() && 
      !classItem.students.includes(req.user.id)) {
    return next(new ErrorResponse(`User${req.user.id}do not have permission to access this class`, 403));
  }
  
  // 獲取學生詳細信息
  const students = await User.find({ 
    _id: { $in: classItem.students },
    role: 'student'
  }).select('name email');
  
  res.status(200).json({
    success: true,
    count: students.length,
    data: students
  });
});


// 示例：一個異步函數，用來獲取所有班級
const getClasses = asyncHandler(async (req, res, next) => {
  const classes = await Class.find(); // 假設這是你的班級查詢
  res.json(classes);
});