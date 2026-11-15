const crypto = require('crypto');
const path = require('path');

function validateLuaUpload(file, metadata = {}) {
  if (!file) {
    throw new Error('No text file was uploaded.');
  }

  if (!Buffer.isBuffer(file.buffer)) {
    throw new Error('Uploaded file could not be read. Please choose the file again.');
  }

  if (file.buffer.length === 0) {
    throw new Error('The selected file is empty.');
  }

  const originalName = path.basename(file.originalname || 'script.lua');
  const lowerName = originalName.toLowerCase();

  if (!/\.(lua|txt)$/i.test(lowerName)) {
    throw new Error('Only .lua and .txt text files are allowed.');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size must be under 2 MB.');
  }

  if (file.buffer.includes(0)) {
    throw new Error('Binary or malformed text file detected.');
  }

  const content = file.buffer.toString('utf8');

  if (!content.trim()) {
    throw new Error('File content is empty.');
  }

  const title = (metadata.title || originalName.replace(/\.(lua|txt)$/i, '') || 'Untitled Script').trim();
  const description = (metadata.description || '').trim();
  const tags = (metadata.tags || '').trim();

  if (!title) {
    throw new Error('A script name is required.');
  }

  return {
    title: title.slice(0, 100),
    description: description.slice(0, 500),
    tags,
    filename: originalName,
    content,
    storageKey: crypto.randomBytes(12).toString('hex')
  };
}

module.exports = { validateLuaUpload };
