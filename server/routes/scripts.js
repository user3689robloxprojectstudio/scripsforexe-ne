const express = require('express');
const multer = require('multer');
const { prisma } = require('../config/database');
const { requireAuth } = require('../middleware/authentication');
const { uploadLimiter } = require('../middleware/rateLimit');
const { validateLuaUpload } = require('../services/uploadService');
const { normalizeTags, formatScript } = require('../services/storageService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

async function getCurrentUser() {
  return prisma.user.findUnique({ where: { id: req.session.userId } });
}

router.get('/api/explore', async (req, res) => {
  const scripts = await prisma.script.findMany({
    where: { visibility: 'public' },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({
    scripts: scripts.map((script) => formatScript(script, script.user))
  });
});

router.get('/api/scripts', requireAuth, async (req, res) => {
  const scripts = await prisma.script.findMany({
    where: { userId: req.session.userId },
    orderBy: { updatedAt: 'desc' }
  });

  return res.json({
    scripts: scripts.map((script) => formatScript(script))
  });
});

router.post('/api/scripts', requireAuth, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file selected.' });
    }

    const validated = validateLuaUpload(req.file, {
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags
    });

    const normalizedTags = normalizeTags(validated.tags);

    const script = await prisma.script.create({
      data: {
        userId: req.session.userId,
        title: validated.title,
        description: validated.description,
        filename: validated.filename,
        storageKey: validated.storageKey,
        visibility: String(req.body.visibility || 'public').toLowerCase() === 'private' ? 'private' : 'public',
        tags: normalizedTags,
        content: validated.content,
        downloads: 0
      }
    });

    return res.status(201).json({
      success: true,
      script: formatScript(script)
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return res.status(400).json({ error: error.message || 'Unknown upload error.' });
  }
});

router.get('/api/scripts/:id', async (req, res) => {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
    include: { user: true }
  });

  if (!script) {
    return res.status(404).json({ error: 'Script not found.' });
  }

  if (script.visibility === 'private' && (!req.session || req.session.userId !== script.userId)) {
    return res.status(403).json({ error: 'This script is private.' });
  }

  return res.json({
    script: formatScript(script, script.user, true)
  });
});

router.patch('/api/scripts/:id', requireAuth, async (req, res) => {
  const script = await prisma.script.findUnique({ where: { id: req.params.id } });

  if (!script) {
    return res.status(404).json({ error: 'Script not found.' });
  }

  if (script.userId !== req.session.userId) {
    return res.status(403).json({ error: 'You do not own this script.' });
  }

  const nextVisibility = String(req.body.visibility || script.visibility).toLowerCase();
  const updated = await prisma.script.update({
    where: { id: script.id },
    data: {
      title: String(req.body.title || script.title).slice(0, 100),
      description: String(req.body.description ?? script.description ?? '').slice(0, 500),
      visibility: nextVisibility === 'private' ? 'private' : 'public',
      tags: normalizeTags(String(req.body.tags ?? script.tags ?? ''))
    }
  });

  return res.json({
    success: true,
    script: formatScript(updated)
  });
});

router.delete('/api/scripts/:id', requireAuth, async (req, res) => {
  const script = await prisma.script.findUnique({ where: { id: req.params.id } });

  if (!script) {
    return res.status(404).json({ error: 'Script not found.' });
  }

  if (script.userId !== req.session.userId) {
    return res.status(403).json({ error: 'You do not own this script.' });
  }

  await prisma.script.delete({ where: { id: script.id } });

  return res.json({ success: true });
});

module.exports = router;
