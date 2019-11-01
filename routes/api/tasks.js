const express = require('express');
const router = express();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Project = require('../../models/Project');
const Task = require('../../models/Task');

/**
 * @route POST /api/tasks/:id
 * @desc Create a task
 * @access Private
 */
router.post('/:id', [auth, [
  check('title', 'Nhập tiêu đề')
    .not()
    .isEmpty(),
  check('from', 'Nhập ngày bắt đầu')
    .not()
    .isEmpty(),
  check('to', 'Nhập ngày kết thúc')
    .not()
    .isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = await Project.findById(req.params.id);

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền truy cập' });
    }

    const newTask = new Task({
      user: req.user.id,
      name: project.name,
      avatar: project.avatar,
      project: project.id,
      project_name: project.title,
      title: req.body.title,
      description: req.body.description,
      from: req.body.from,
      to: req.body.to,
      state: req.body.state
    });

    const task = await newTask.save();

    res.json(task);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});


/**
 * @route GET /api/tasks/all
 * @desc GET all tasks
 * @access Public
 */
router.get('/all', async (req, res) => {
  try {
    const task = await Task.find().sort({ date: -1 });

    res.json(task);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route GET /api/tasks
 * @desc GET tasks by user ID
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });

    res.json(tasks);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route GET /api/tasks
 * @desc GET tasks by task ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền truy cập' });
    }

    res.json(task);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route DELETE /api/tasks/:id
 * @desc GET tasks by user ID
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền xóa Task này' });
    }

    await task.remove();

    res.json({ msg: 'Xóa task thành công' });

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route POST /api/tasks/update/:id
 * @desc Update task by task ID
 * @access Private
 */
router.post('/update/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền chỉnh sửa task này' });
    }

    const {
      title,
      description,
      from,
      to,
      state
    } = req.body;

    taskFields = {};
    taskFields.user = req.user.id;
    if (title) taskFields.title = title;
    if (description) taskFields.description = description;
    if (from) taskFields.from = from;
    if (to) taskFields.to = to;
    if (state) taskFields.state = state;

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: taskFields },
      { new: true }
    );

    return res.json(task);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route POST /api/tasks/comment/:id
 * @desc Add comment to a task
 * @access Private
 */
router.post('/comment/:id', [auth, [
  check('text', 'Text is required')
    .not()
    .isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = await Task.findById(req.params.id);
    const user = await User.findById(req.user.id).select('-password');

    if (!task) {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền bình luận trong task này' });
    }

    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    };

    task.comment.unshift(newComment);

    await task.save();

    res.json(task.comment);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route DELETE /api/tasks/comment/:id/:comment_id
 * @desc Delete a comment on task
 * @access Private
 */
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const comment = await task.comment.find(comment => comment.id === req.params.comment_id);

    if (!comment) {
      return res.status(404).json({ msg: 'Bình luận không tồn tại hoặc đã bị xóa' });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền xóa bình luận này' });
    }

    const removeIndex = task.comment
    .map(comment => comment.user.toString())
    .indexOf(req.user.id);

    task.comment.splice(removeIndex, 1);

    await task.save();

    res.json(task.comment);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

module.exports = router;
