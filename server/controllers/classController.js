const { validationResult } = require('express-validator');
const Class = require('../models/Class');

// @desc    獲取所有課程
// @route   GET /api/v1/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    獲取單個課程
// @route   GET /api/v1/classes/:id
// @access  Private
exports.getClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!classItem) {
      return res.status(404).json({ msg: '找不到課程' });
    }

    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到課程' });
    }
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    創建課程
// @route   POST /api/v1/classes
// @access  Private/Teacher
exports.createClass = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category } = req.body;

  try {
    const newClass = new Class({
      title,
      description,
      category,
      teacher: req.user.id
    });

    const classItem = await newClass.save();
    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    更新課程
// @route   PUT /api/v1/classes/:id
// @access  Private/Teacher
exports.updateClass = async (req, res) => {
  const { title, description, category } = req.body;

  try {
    let classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ msg: '找不到課程' });
    }

    // 確保只有課程的教師可以更新
    if (classItem.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: '無權限更新此課程' });
    }

    if (title) classItem.title = title;
    if (description) classItem.description = description;
    if (category) classItem.category = category;

    await classItem.save();
    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到課程' });
    }
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    刪除課程
// @route   DELETE /api/v1/classes/:id
// @access  Private/Teacher
exports.deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ msg: '找不到課程' });
    }

    // 確保只有課程的教師可以刪除
    if (classItem.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: '無權限刪除此課程' });
    }

    await classItem.remove();
    res.json({ msg: '課程已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到課程' });
    }
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    報名課程
// @route   POST /api/v1/classes/:id/enroll
// @access  Private/Student
exports.enrollClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ msg: '找不到課程' });
    }

    // 檢查是否已經報名
    if (classItem.students.includes(req.user.id)) {
      return res.status(400).json({ msg: '已經報名此課程' });
    }

    classItem.students.push(req.user.id);
    await classItem.save();

    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到課程' });
    }
    res.status(500).send('伺服器錯誤');
  }
};

// @desc    退出課程
// @route   POST /api/v1/classes/:id/leave
// @access  Private/Student
exports.leaveClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ msg: '找不到課程' });
    }

    // 檢查是否已經報名
    if (!classItem.students.includes(req.user.id)) {
      return res.status(400).json({ msg: '尚未報名此課程' });
    }

    classItem.students = classItem.students.filter(
      student => student.toString() !== req.user.id
    );
    await classItem.save();

    res.json(classItem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到課程' });
    }
    res.status(500).send('伺服器錯誤');
  }
}; 