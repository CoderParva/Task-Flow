const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: check if user is admin of project
const isProjectAdmin = (projectId, userId) => {
  const m = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, userId);
  return m && m.role === 'admin';
};

// Helper: check if user is member of project
const isProjectMember = (projectId, userId) => {
  return !!db.prepare(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, userId);
};

// GET /api/projects – list all projects user belongs to
router.get('/', authenticateToken, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, pm.role as user_role, u.name as creator_name,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
           (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.created_by
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// POST /api/projects – create project
router.post('/', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const createProject = () => {
    db.exec('BEGIN');
    try {
      const result = db.prepare(
        'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
      ).run(name.trim(), description || null, req.user.id);

      // Creator becomes admin
      db.prepare(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
      ).run(result.lastInsertRowid, req.user.id, 'admin');

      db.exec('COMMIT');
      return result.lastInsertRowid;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };

  const projectId = createProject();
  const project = db.prepare(`
    SELECT p.*, pm.role as user_role, u.name as creator_name
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.created_by
    WHERE p.id = ?
  `).get(req.user.id, projectId);

  res.status(201).json(project);
});

// GET /api/projects/:id – project details
router.get('/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  if (!isProjectMember(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const project = db.prepare(`
    SELECT p.*, pm.role as user_role, u.name as creator_name
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.created_by
    WHERE p.id = ?
  `).get(req.user.id, projectId);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM users u
    JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(projectId);

  res.json({ ...project, members });
});

// PUT /api/projects/:id – update project (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  if (!isProjectAdmin(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?')
    .run(name.trim(), description || null, projectId);

  res.json({ message: 'Project updated' });
});

// DELETE /api/projects/:id – delete project (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  if (!isProjectAdmin(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  res.json({ message: 'Project deleted' });
});

// GET /api/projects/:id/members – list members
router.get('/:id/members', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  if (!isProjectMember(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM users u
    JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(projectId);

  res.json(members);
});

// POST /api/projects/:id/members – add member (admin only)
router.post('/:id/members', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  if (!isProjectAdmin(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { email, role = 'member' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or member' });
  }

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found. They must register first.' });

  if (isProjectMember(projectId, user.id)) {
    return res.status(409).json({ error: 'User is already a member' });
  }

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(projectId, user.id, role);

  res.status(201).json({ message: 'Member added', user: { ...user, role } });
});

// PUT /api/projects/:id/members/:userId – update member role (admin only)
router.put('/:id/members/:userId', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);

  if (!isProjectAdmin(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or member' });
  }

  // Prevent demoting yourself if you're the only admin
  if (targetUserId === req.user.id && role === 'member') {
    const admins = db.prepare(
      "SELECT COUNT(*) as count FROM project_members WHERE project_id = ? AND role = 'admin'"
    ).get(projectId);
    if (admins.count <= 1) {
      return res.status(400).json({ error: 'Cannot demote the only admin' });
    }
  }

  db.prepare('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?')
    .run(role, projectId, targetUserId);

  res.json({ message: 'Member role updated' });
});

// DELETE /api/projects/:id/members/:userId – remove member (admin only)
router.delete('/:id/members/:userId', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);

  if (!isProjectAdmin(projectId, req.user.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: 'Cannot remove yourself from the project' });
  }

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
    .run(projectId, targetUserId);

  res.json({ message: 'Member removed' });
});

module.exports = router;
