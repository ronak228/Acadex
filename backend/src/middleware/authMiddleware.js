const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate requests using JWT
 * Reads Authorization header, verifies token, and attaches req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Attach decoded user payload to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Expired token' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to authorize requests based on user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // SUPER_ADMIN has access to all routes by default
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient role' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
