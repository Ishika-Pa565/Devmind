const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.get('/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code },
      { headers: { Accept: 'application/json' } }
    );
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { id, login, avatar_url } = userRes.data;

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

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

module.exports = router;