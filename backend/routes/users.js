const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?email= – search user by email for adding to project
router.get('/search', authenticateToken, (req, res) => {
  const { email } = req.query;
  if (!email || email.length < 3) {
    return res.status(400).json({ error: 'Provide at least 3 characters to search' });
  }

  const users = db.prepare(
    'SELECT id, name, email FROM users WHERE email LIKE ? AND id != ? LIMIT 10'
  ).all(`%${email.toLowerCase()}%`, req.user.id);

  res.json(users);
});

module.exports = router;
