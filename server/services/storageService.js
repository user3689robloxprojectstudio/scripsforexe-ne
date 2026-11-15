function normalizeTags(input = '') {
  return Array.from(new Set(
    String(input)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5)
  )).join(',');
}

function formatScript(script, user = null, includeContent = false) {
  const data = {
    id: script.id,
    title: script.title,
    description: script.description,
    filename: script.filename,
    storageKey: script.storageKey,
    visibility: script.visibility,
    tags: script.tags ? script.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    downloads: script.downloads,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
    rawUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/raw/${script.storageKey}`,
    user: user ? {
      id: user.id,
      username: user.username,
      avatar: user.avatar
    } : null
  };

  if (includeContent) {
    data.content = script.content;
  }

  return data;
}

module.exports = { normalizeTags, formatScript };
