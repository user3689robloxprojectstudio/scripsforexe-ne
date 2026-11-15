const express = require('express');
const { prisma } = require('../config/database');
const { buildDiscordAuthUrl, exchangeCodeForDiscordUser, generateStateToken } = require('../config/discord');
const { requireAuth } = require('../middleware/authentication');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/auth/discord', authLimiter, (req, res) => {
  const state = generateStateToken();
  req.session.discordState = state;
  return res.redirect(buildDiscordAuthUrl(state));
});

router.get('/auth/discord/callback', authLimiter, async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Discord OAuth failed: missing code or state.');
  }

  if (req.session.discordState !== state) {
    return res.status(400).send('Invalid OAuth state.');
  }

  try {
    const discordUser = await exchangeCodeForDiscordUser(String(code));

    const existingUser = await prisma.user.findUnique({
      where: { discordId: discordUser.discordId }
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: discordUser.username,
          avatar: discordUser.avatar
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          discordId: discordUser.discordId,
          username: discordUser.username,
          avatar: discordUser.avatar
        }
      });
    }

    req.session.userId = user.id;
    req.session.discordState = null;
    req.session.save(() => {
      res.redirect('/dashboard.html');
    });
  } catch (error) {
    console.error('Discord callback error:', error);
    res.status(500).send('Unable to authenticate with Discord.');
  }
});

router.get('/api/auth/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ authenticated: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId }
  });

  if (!user) {
    req.session.destroy(() => res.json({ authenticated: false }));
    return;
  }

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

router.post('/api/auth/logout', requireAuth, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Could not log out.' });
    }

    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

module.exports = router;
