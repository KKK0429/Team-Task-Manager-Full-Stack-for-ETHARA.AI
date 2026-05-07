// middleware/auth.js
// This middleware checks if the user is logged in (has a valid JWT token)

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';

// Middleware: protect routes that require login
function authenticateToken(req, res, next) {
  // Token comes in the header: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get just the token part

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token - this will throw an error if token is invalid/expired
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next(); // Move to the next function (the actual route handler)
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Middleware: only allow admins
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
