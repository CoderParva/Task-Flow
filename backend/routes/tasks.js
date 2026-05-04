const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const isProjectAdmin = (projectId, userId) => {
  const m = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, userId);
  return m && m.role === 'admin';
};

const isProjectMember = (projectId, userId) => {
  return !!db.prepare(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, userId);
};

// GET /api/tasks – all tasks for user's projects (dashboard)
router.get('/', authenticateToken, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, 
           u.name as assigned_to_name,
           u.email as assigned_to_email,
           c.name as created_by_name,
           p.name as project_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN users c ON c.id = t.created_by
    ORDER BY t.created_at DESC
  `).all(req.user.id);
  res.json(tasks);
});

// GET /api/tasks/dashboard – aggregated stats
router.get('/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const totalTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
  `).get(userId);

  const byStatus = db.prepare(`
    SELECT t.status, COUNT(*) as count FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    GROUP BY t.status
  `).all(userId);

  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.due_date < date('now') AND t.status != 'done'
  `).get(userId);

  const byUser = db.prepare(`
    SELECT u.name, u.id, COUNT(*) as task_count FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.assigned_to IS NOT NULL
    GROUP BY t.assigned_to
    ORDER BY task_count DESC
    LIMIT 10
  `).all(userId);

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assigned_to_name, p.name as project_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assigned_to
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all(userId);

  const myTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t
    WHERE t.assigned_to = ? AND t.status != 'done'
  `).get(userId);

  res.json({
    totalTasks: totalTasks.count,
    byStatus,
    overdue: overdue.count,
    byUser,
    recentTasks,
    myActiveTasks: myTasks.count
  });
});

// GET /api/tasks/project/:projectId – tasks in a project
router.get('/project/:projectId', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.projectId);
  if (!isProjectMember(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const tasks = db.prepare(`
    SELECT t.*, 
           u.name as assigned_to_name,
           u.email as assigned_to_email,
           c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.project_id = ?
    ORDER BY 
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      t.due_date ASC,
      t.created_at DESC
  `).all(projectId);

  res.json(tasks);
});

// POST /api/tasks – create task (admin only)
router.post('/', authenticateToken, (req, res) => {
  const { title, description, project_id, assigned_to, due_date, priority = 'medium' } = req.body;

  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!project_id) return res.status(400).json({ error: 'Project ID is required' });
  if (!['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Priority must be low, medium, or high' });
  }

  if (!isProjectAdmin(project_id, req.user.id)) {
    return res.status(403).json({ error: 'Only admins can create tasks' });
  }

  // Validate assignee is a project member
  if (assigned_to && !isProjectMember(project_id, assigned_to)) {
    return res.status(400).json({ error: 'Assigned user must be a project member' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title.trim(), description || null, project_id, assigned_to || null, req.user.id, priority, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// GET /api/tasks/:id – single task
router.get('/:id', authenticateToken, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN users c ON c.id = t.created_by
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(parseInt(req.params.id));

  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!isProjectMember(task.project_id, req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(task);
});

// PUT /api/tasks/:id – update task
router.put('/:id', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!isProjectMember(task.project_id, req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const isAdmin = isProjectAdmin(task.project_id, req.user.id);
  const isAssignee = Number(task.assigned_to) === Number(req.user.id);

  // Members can only update status of their own tasks
  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ error: 'You can only update tasks assigned to you' });
  }

  const { title, description, assigned_to, due_date, priority, status } = req.body;

  // Members can only update status
  if (!isAdmin) {
    if (!status) return res.status(400).json({ error: 'Status is required' });
    if (!['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, taskId);
    return res.json({ message: 'Task status updated' });
  }

  // Admin can update everything
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  if (status && !['todo', 'in_progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }
  if (assigned_to && !isProjectMember(task.project_id, assigned_to)) {
    return res.status(400).json({ error: 'Assigned user must be a project member' });
  }

  db.prepare(`
    UPDATE tasks SET
      title = ?, description = ?, assigned_to = ?,
      due_date = ?, priority = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title.trim(),
    description || null,
    assigned_to || null,
    due_date || null,
    priority || task.priority,
    status || task.status,
    taskId
  );

  const updated = db.prepare(`
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.id = ?
  `).get(taskId);

  res.json(updated);
});

// DELETE /api/tasks/:id – delete task (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!isProjectAdmin(task.project_id, req.user.id)) {
    return res.status(403).json({ error: 'Only admins can delete tasks' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
