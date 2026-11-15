function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  next();
}

function maybeAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.isAuthenticated = true;
  }

  next();
}

module.exports = { requireAuth, maybeAuth };
