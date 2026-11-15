const express = require('express');
const { prisma } = require('../config/database');
const { maybeAuth } = require('../middleware/authentication');

const router = express.Router();

router.get('/raw/:id', maybeAuth, async (req, res) => {
  const script = await prisma.script.findUnique({
    where: { storageKey: req.params.id }
  });

  if (!script) {
    return res.status(404).type('text/plain').send('Script not found.');
  }

  const isOwner = req.session && req.session.userId === script.userId;
  if (script.visibility === 'private' && !isOwner) {
    return res.status(404).type('text/plain').send('Private script not found.');
  }

  await prisma.script.update({
    where: { id: script.id },
    data: {
      downloads: {
        increment: 1
      }
    }
  });

  return res.type('text/plain; charset=utf-8').send(script.content);
});

module.exports = router;
