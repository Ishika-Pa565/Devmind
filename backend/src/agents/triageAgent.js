const { ask } = require('../services/gemini');
const { addIssue, findSimilar } = require('../services/embedder');
const db = require('../db');

const DUPLICATE_THRESHOLD = 0.15; // cosine distance — lower = more similar

async function runTriageAgent(issueId) {
  console.log(`\n🔍 [TriageAgent] Starting for issue #${issueId}`);

  // 1. Load issue from DB
  const { rows } = await db.query('SELECT * FROM issues WHERE id = $1', [issueId]);
  if (!rows.length) throw new Error(`Issue ${issueId} not found`);
  const issue = rows[0];

  await logEvent(issueId, 'triage', 'running', { step: 'classifying severity' });

  // 2. Ask Gemini to classify severity + component
  const classifyPrompt = `
You are a senior software engineer triaging a GitHub issue.

Issue title: "${issue.title}"
Issue body: "${issue.body?.slice(0, 500) || 'No description'}"

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "severity": "critical" | "high" | "medium" | "low",
  "component": "<one of: auth, ui, api, database, performance, security, infra, other>",
  "reasoning": "<one sentence explaining your classification>"
}

Severity guide:
- critical: system down, data loss, security breach
- high: major feature broken, affects many users
- medium: feature partially broken, workaround exists
- low: minor bug, cosmetic issue, typo
`;

  let classification = { severity: 'medium', component: 'other', reasoning: 'Default fallback' };
  try {
    const raw = await ask(classifyPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    classification = JSON.parse(cleaned);
  } catch (e) {
    console.error('[TriageAgent] Gemini parse error:', e.message);
  }

  console.log(`✅ [TriageAgent] Classified: ${classification.severity} | ${classification.component}`);

  // 3. Duplicate detection
  const issueText = `${issue.title} ${issue.body || ''}`;
  const similar = await findSimilar(issueText);

  let isDuplicate = false;
  let duplicateOf = null;

  for (const match of similar) {
    if (String(match.id) === String(issueId)) continue;
    if (match.distance < DUPLICATE_THRESHOLD) {
      isDuplicate = true;
      duplicateOf = parseInt(match.id);
      console.log(`⚠️  [TriageAgent] Duplicate detected — similar to issue #${duplicateOf} (distance: ${match.distance.toFixed(3)})`);
      break;
    }
  }

  // 4. Add this issue to the vector store
  await addIssue(issueId, issueText);

  // 5. Save triage results to DB
  await db.query( 
   `UPDATE issues
    SET severity = $1, component_tag = $2, is_duplicate = $3, duplicate_of = $4, updated_at = NOW()
    WHERE id = $5`,
    [classification.severity, classification.component, isDuplicate, duplicateOf, issueId]
   );

  const result = { ...classification, isDuplicate, duplicateOf };

  await logEvent(issueId, 'triage', 'completed', result);

  console.log(`🎉 [TriageAgent] Done for issue #${issueId}`);
  return result;
}

async function logEvent(issueId, agentName, status, payload) {
  await db.query(
    `INSERT INTO agent_events (issue_id, agent_name, status, payload)
     VALUES ($1, $2, $3, $4)`,
    [issueId, agentName, status, JSON.stringify(payload)]
  );
}

module.exports = { runTriageAgent };