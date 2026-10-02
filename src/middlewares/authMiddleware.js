const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const extractBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const match = authorizationHeader.match(
    /^Bearer\s+([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)$/,
  );

  return match ? match[1] : null;
};

const requireAuth = catchAsync(async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization) || 'invalid';

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new AppError('Server JWT configuration is missing', 500));
  }

  const allowedAlgorithms = (process.env.JWT_ALGORITHMS || 'HS256')
    .split(',')
    .map((algorithm) => algorithm.trim())
    .filter(Boolean);

  const decoded = jwt.verify(token, secret, {
    algorithms: allowedAlgorithms,
  });

  if (!decoded || !decoded.id) {
    return next(new AppError('Invalid or expired token', 401));
  }

  const user = await User.findById(decoded.id).select('+isActive');

  if (!user || user.isActive === false) {
    return next(new AppError('Invalid or expired token', 401));
  }

  req.user = user;
  return next();
});

const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication is required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You are not allowed to access this resource', 403),
      );
    }

    return next();
  };

module.exports = {
  requireAuth,
  authorizeRoles,
};
