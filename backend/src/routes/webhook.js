const router = require('express').Router();
const db = require('../db');
const { runTriageAgent } = require('../agents/triageAgent');

router.post('/', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`📨 GitHub event: ${event}`);

  // Guard: ignore ping and malformed payloads
  if (event !== 'issues') return res.status(200).json({ received: true });
  if (payload.action !== 'opened') return res.status(200).json({ received: true });
  if (!payload.repository || !payload.issue) return res.status(200).json({ received: true });

  const { number, title, body, html_url } = payload.issue;
  const repo = payload.repository.full_name;

  const result = await db.query(
    `INSERT INTO issues (github_issue_id, repo_full_name, title, body, github_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [number, repo, title, body || '', html_url]
  );

  const issueId = result.rows[0].id;
  console.log(`✅ Issue saved: #${number} → DB id ${issueId}`);

  const io = req.app.get('io');
  if (io) io.emit('new_issue', { id: issueId, title, repo, github_url: html_url });

  res.status(200).json({ received: true });
});