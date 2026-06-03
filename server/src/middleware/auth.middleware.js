const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'safepath-dev-secret-change-in-production';

/**
 * Express middleware: verifies Bearer JWT token and attaches req.user.
 * Responds 401 if token is missing or invalid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
