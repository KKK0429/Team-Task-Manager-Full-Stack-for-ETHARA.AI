const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = db.all(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p JOIN users u ON p.created_by = u.id
        WHERE p.created_by = ? ORDER BY p.created_at DESC`, [req.user.id]);
    } else {
      projects = db.all(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p JOIN users u ON p.created_by = u.id
        JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        GROUP BY p.id ORDER BY p.created_at DESC`, [req.user.id]);
    }
    res.json(projects);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch projects.' }); }
});

router.get('/:id', (req, res) => {
  try {
    const project = db.get(`SELECT p.*, u.name as creator_name FROM projects p JOIN users u ON p.created_by = u.id WHERE p.id = ?`, [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    const members = db.all(`SELECT u.id, u.name, u.email, u.role, pm.joined_at FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?`, [req.params.id]);
    const tasks = db.all(`SELECT t.*, u.name as assigned_to_name, creator.name as created_by_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id JOIN users creator ON t.created_by = creator.id WHERE t.project_id = ? ORDER BY t.created_at DESC`, [req.params.id]);
    res.json({ ...project, members, tasks });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch project.' }); }
});

router.post('/', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required.' });
  try {
    const result = db.run('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)', [name.trim(), description || '', req.user.id]);
    db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [result.lastInsertRowid, req.user.id]);
    const newProject = db.get('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Project created!', project: newProject });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create project.' }); }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required.' });
  try {
    const project = db.get('SELECT * FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    db.run('UPDATE projects SET name = ?, description = ? WHERE id = ?', [name.trim(), description || '', req.params.id]);
    res.json({ message: 'Project updated.' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to update project.' }); }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const project = db.get('SELECT * FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    db.run('DELETE FROM tasks WHERE project_id = ?', [req.params.id]);
    db.run('DELETE FROM project_members WHERE project_id = ?', [req.params.id]);
    db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted.' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to delete project.' }); }
});

router.post('/:id/members', requireAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'User email is required.' });
  try {
    const project = db.get('SELECT * FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: 'No user found with that email.' });
    const existing = db.get('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, user.id]);
    if (!existing) db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [req.params.id, user.id]);
    res.json({ message: `${user.name} added to project!` });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to add member.' }); }
});

router.delete('/:id/members/:userId', requireAdmin, (req, res) => {
  try {
    db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed.' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to remove member.' }); }
});

module.exports = router;
