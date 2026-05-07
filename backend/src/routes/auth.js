const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.get('/github', (req, res) => {
  const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '';
  const state = Buffer.from(JSON.stringify({ redirect })).toString('base64url');
  if (!process.env.GITHUB_CLIENT_ID) {
    console.error('❌ Missing GITHUB_CLIENT_ID in env');
  }
  console.log('🔐 OAuth start', { redirect: redirect || '(none)' });
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user&state=${state}`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    console.log('🔁 OAuth callback', {
      code: typeof code === 'string' ? `${code.slice(0, 6)}…` : '(missing)',
      hasState: typeof state === 'string' && state.length > 0,
    });

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code },
      { headers: { Accept: 'application/json' } }
    );
    console.log('🎫 Token exchange response', {
      status: tokenRes.status,
      hasAccessToken: Boolean(tokenRes.data?.access_token),
      error: tokenRes.data?.error,
      error_description: tokenRes.data?.error_description,
    });

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new Error(`No access_token from GitHub (error=${tokenRes.data?.error || 'unknown'})`);
    }

    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { id, login, avatar_url } = userRes.data;
    console.log('👤 GitHub user', { id, login });

    await db.query(
      `INSERT INTO users (github_id, username, avatar_url, access_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (github_id) DO UPDATE SET access_token = $4, avatar_url = $3`,
      [String(id), login, avatar_url, accessToken]
    );

    const jwtToken = jwt.sign(
      { githubId: String(id), username: login, avatar: avatar_url },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    let frontendUrl = process.env.FRONTEND_URL;
    if (typeof state === 'string' && state.length > 0) {
      try {
        const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        if (parsed?.redirect && typeof parsed.redirect === 'string') frontendUrl = parsed.redirect;
      } catch {
        // ignore invalid state
      }
    }

    const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(jwtToken)}`;
    console.log('✅ OAuth success redirecting', {
      frontendUrl,
      jwtLen: jwtToken.length,
      redirectPreview: `${frontendUrl}/auth/callback?token=${encodeURIComponent(jwtToken.slice(0, 12))}…`,
    });
    res.redirect(redirectUrl);
  } catch (err) {
    const message = err?.message || 'OAuth failed';
    console.error('❌ OAuth failed', message);

    let frontendUrl = process.env.FRONTEND_URL;
    if (typeof state === 'string' && state.length > 0) {
      try {
        const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        if (parsed?.redirect && typeof parsed.redirect === 'string') frontendUrl = parsed.redirect;
      } catch {
        // ignore invalid state
      }
    }

    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
  }
});

module.exports = router;