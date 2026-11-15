const express = require('express');
const { prisma } = require('../config/database');
const { requireAuth } = require('../middleware/authentication');

const router = express.Router();

router.get('/api/users/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: {
      scripts: true
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({
    user: {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      scriptCount: user.scripts.length
    }
  });
});

router.patch('/api/users/me', requireAuth, async (req, res) => {
  const username = String(req.body.username || '').trim();

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  const user = await prisma.user.update({
    where: { id: req.session.userId },
    data: {
      username: username.slice(0, 36)
    }
  });

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discordId: user.discordId
    }
  });
});

router.delete('/api/users/me', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  await prisma.script.deleteMany({
    where: { userId }
  });

  await prisma.user.delete({
    where: { id: userId }
  });

  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

module.exports = router;
