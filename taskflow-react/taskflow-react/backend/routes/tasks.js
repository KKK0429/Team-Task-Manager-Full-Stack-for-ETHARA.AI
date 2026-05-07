const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(authenticateToken);

router.get('/users/all', requireAdmin, (req, res) => {
  try {
    const users = db.all('SELECT id, name, email, role FROM users ORDER BY name');
    res.json(users);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch users.' }); }
});

router.get('/dashboard', (req, res) => {
  try {
    let stats = {};
    const today = new Date().toISOString().split('T')[0];
    if (req.user.role === 'admin') {
      stats.total_projects = (db.get('SELECT COUNT(*) as count FROM projects WHERE created_by = ?', [req.user.id]) || {}).count || 0;
      stats.total_tasks = (db.get('SELECT COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.created_by = ?', [req.user.id]) || {}).count || 0;
      stats.todo = (db.get("SELECT COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.created_by = ? AND t.status = 'todo'", [req.user.id]) || {}).count || 0;
      stats.in_progress = (db.get("SELECT COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.created_by = ? AND t.status = 'in_progress'", [req.user.id]) || {}).count || 0;
      stats.done = (db.get("SELECT COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.created_by = ? AND t.status = 'done'", [req.user.id]) || {}).count || 0;
      stats.overdue = (db.get(`SELECT COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.created_by = ? AND t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < ?`, [req.user.id, today]) || {}).count || 0;
      stats.recent_tasks = db.all(`SELECT t.*, p.name as project_name, u.name as assigned_to_name FROM tasks t JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE p.created_by = ? ORDER BY t.created_at DESC LIMIT 5`, [req.user.id]);
    } else {
      stats.total_projects = (db.get('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?', [req.user.id]) || {}).count || 0;
      stats.total_tasks = (db.get('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ?', [req.user.id]) || {}).count || 0;
      stats.todo = (db.get("SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'todo'", [req.user.id]) || {}).count || 0;
      stats.in_progress = (db.get("SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'in_progress'", [req.user.id]) || {}).count || 0;
      stats.done = (db.get("SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'done'", [req.user.id]) || {}).count || 0;
      stats.overdue = (db.get(`SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status != 'done' AND due_date IS NOT NULL AND due_date < ?`, [req.user.id, today]) || {}).count || 0;
      stats.recent_tasks = db.all(`SELECT t.*, p.name as project_name, u.name as assigned_to_name FROM tasks t JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE t.assigned_to = ? ORDER BY t.created_at DESC LIMIT 5`, [req.user.id]);
    }
    res.json(stats);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to load dashboard.' }); }
});

router.get('/project/:projectId', (req, res) => {
  try {
    const tasks = db.all(`SELECT t.*, u.name as assigned_to_name, creator.name as created_by_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id JOIN users creator ON t.created_by = creator.id WHERE t.project_id = ? ORDER BY t.created_at DESC`, [req.params.projectId]);
    res.json(tasks);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch tasks.' }); }
});

router.post('/', requireAdmin, (req, res) => {
  const { title, description, project_id, assigned_to, due_date, priority } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project are required.' });
  try {
    const project = db.get('SELECT * FROM projects WHERE id = ? AND created_by = ?', [project_id, req.user.id]);
    if (!project) return res.status(403).json({ error: 'You do not own this project.' });
    const result = db.run(
      'INSERT INTO tasks (title, description, project_id, assigned_to, due_date, priority, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), description || '', project_id, assigned_to || null, due_date || null, priority || 'medium', req.user.id]
    );
    const newTask = db.get(`SELECT t.*, u.name as assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?`, [result.lastInsertRowid]);
    res.status(201).json({ message: 'Task created!', task: newTask });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create task.' }); }
});

router.put('/:id', (req, res) => {
  const { title, description, status, priority, assigned_to, due_date } = req.body;
  try {
    const task = db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (req.user.role === 'member') {
      if (task.assigned_to !== req.user.id) return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
      db.run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status || task.status, req.params.id]);
    } else {
      db.run(
        'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title || task.title, description !== undefined ? description : task.description, status || task.status, priority || task.priority, assigned_to !== undefined ? assigned_to : task.assigned_to, due_date !== undefined ? due_date : task.due_date, req.params.id]
      );
    }
    const updatedTask = db.get(`SELECT t.*, u.name as assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?`, [req.params.id]);
    res.json({ message: 'Task updated!', task: updatedTask });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to update task.' }); }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const task = db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    db.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted.' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to delete task.' }); }
});

module.exports = router;
