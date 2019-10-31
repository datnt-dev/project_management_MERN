const express = require('express');
const router = express();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Project = require('../../models/Project');

/**
 * @route POST /api/projects
 * @desc Create a project
 * @access Private
 */
router.post('/', [auth, [
  check('title', 'Nhập tiêu đề dự án')
    .not()
    .isEmpty(),
  check('from', 'Nhập ngày bắt đầu dự án')
    .not()
    .isEmpty(),
  check('to', 'Nhập ngày dự kiến hoàn thành dự án')
    .not()
    .isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');

    const newProject = new Project({
      user: req.user.id,
      name: user.name,
      avatar: user.avatar,
      title: req.body.title,
      description: req.body.description,
      from: req.body.from,
      to: req.body.to,
      state: req.body.state
    });

    const project = await newProject.save();

    res.json(project);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route GET /api/projects
 * @desc GET all projects
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ date: -1 });

    res.json(projects);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route GET /api/projects/:id
 * @desc GET project by ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project không tồn tài hoặc đã bị xóa' });
    }

    res.json(project);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route DELETE /api/projects/:id
 * @desc DELETE project by ID
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    } else {

      // Check User
      if (project.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Tài khoản không được phép xóa project' });
      }

      await project.remove();

      res.json({ msg: 'Xóa Project thành công' });
    }

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route POST /api/projects/update/:id
 * @desc Update project by ID
 * @access Private
 */
router.post('/update/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    } else {
      if (project.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Tài khoản không được phép chỉnh sửa project' });
      }

      const {
        title,
        description,
        from,
        to,
        state
      } = req.body;

      projectFields = {};
      projectFields.user = req.user.id;
      if (title) projectFields.title = title;
      if (description) projectFields.title = description;
      if (from) projectFields.title = from;
      if (to) projectFields.title = to;
      if (state) projectFields.title = state;

      project = await Project.findByIdAndUpdate(
        req.params.id,
        { $set: projectFields },
        { new: true }
      );

      return res.json(project);
    }
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route POST /api/projects/comment/:id
 * @desc Add comment to a project
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
    const user = await User.findById(req.user.id).select('-password');
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: ' Project không tồn tại hoặc đã bị xóa' });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền comment project này' });
    }

    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    };

    project.comment.unshift(newComment);

    await project.save();

    res.json(project.comment);

  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

/**
 * @route DELETE /api/projects/comment/:id/:comment_id
 * @desc DELETE comment by ID
 * @access Private
 */
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const comment = await project.comment.find(comment => comment.id === req.params.comment_id);

    // Check comment exist
    if (!comment) {
      return res.status(404).json({ msg: ' Bình luận không tồn tại hoặc đã bị xóa' });
    }

    // Check User
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Tài khoản không có quyền xóa bình luận này' });
    }

    // GET remove index
    const removeIndex = project.comment
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);

    project.comment.splice(removeIndex, 1);

    await project.save();

    res.json(project.comment);

  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project không tồn tại hoặc đã bị xóa' });
    }

    res.status(500).send('Server Error');
  }
});

module.exports = router;
