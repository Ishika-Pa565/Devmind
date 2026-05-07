const router = require('express').Router();
const db = require('../db');
const { runTriageAgent } = require('../agents/triageAgent');

router.post('/', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`📨 GitHub event: ${event}`);

  if (event !== 'issues') return res.status(200).json({ received: true });
  if (payload.action !== 'opened') return res.status(200).json({ received: true });
  if (!payload.repository || !payload.issue) return res.status(200).json({ received: true });

  const { number, title, body, html_url } = payload.issue;
  const repo = payload.repository.full_name;

  // Save issue to DB
  const result = await db.query(
    `INSERT INTO issues (github_issue_id, repo_full_name, title, body, github_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [number, repo, title, body || '', html_url]
  );
  const issueId = result.rows[0].id;
  console.log(`✅ Issue saved: #${number} → DB id ${issueId}`);

  // Respond to GitHub immediately (don't make GitHub wait for AI)
  res.status(200).json({ received: true });

  // Run Triage Agent asynchronously
  const io = req.app.get('io');

  // Emit raw issue to frontend first
  if (io) io.emit('new_issue', { id: issueId, title, repo, github_url: html_url });

  // Run agent and emit updated result
  runTriageAgent(issueId)
    .then((triageResult) => {
      if (io) io.emit('issue_triaged', {
        id: issueId,
        title,
        repo,
        ...triageResult,
      });
      console.log(`📡 Emitted triage result for issue #${issueId}`);
    })
    .catch(err => console.error('[webhook] Triage agent error:', err));
});

module.exports = router;