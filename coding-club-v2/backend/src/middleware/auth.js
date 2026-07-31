const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError } = require('../shared/errors');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AuthError('No token provided'));
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AuthError('Token expired'));
    return next(new AuthError('Invalid token'));
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AuthError('Insufficient permissions'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
