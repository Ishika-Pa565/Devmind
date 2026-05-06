const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const result = await db.query(
    `SELECT * FROM issues ORDER BY created_at DESC LIMIT 50`
  );
  res.json(result.rows);
});

router.get('/:id', auth, async (req, res) => {
  const issue = await db.query(`SELECT * FROM issues WHERE id = $1`, [req.params.id]);
  const events = await db.query(`SELECT * FROM agent_events WHERE issue_id = $1 ORDER BY created_at ASC`, [req.params.id]);
  res.json({ ...issue.rows[0], agent_events: events.rows });
});

module.exports = router;