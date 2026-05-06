const db = require('./index');

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      github_id VARCHAR(50) UNIQUE NOT NULL,
      username VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      access_token TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      github_issue_id INTEGER NOT NULL,
      repo_full_name VARCHAR(200) NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      severity VARCHAR(20),
      component_tag VARCHAR(100),
      is_duplicate BOOLEAN DEFAULT FALSE,
      duplicate_of INTEGER,
      state VARCHAR(20) DEFAULT 'open',
      github_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id SERIAL PRIMARY KEY,
      issue_id INTEGER REFERENCES issues(id),
      agent_name VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      issue_id INTEGER REFERENCES issues(id),
      assigned_to VARCHAR(100),
      confidence INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Migration complete');
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });