const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const extractToken = (req) => {
  if (
    req.headers.authorization &&
    typeof req.headers.authorization === 'string'
  ) {
    const match = req.headers.authorization.match(
      /^Bearer\s+([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)$/,
    );
    if (match) return match[1];
  }

  if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }

  if (req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
    if (match) return match[1];
  }

  return null;
};

const requireAuth = catchAsync(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new AppError('Server JWT configuration is missing', 500));
  }

  const allowedAlgorithms = (process.env.JWT_ALGORITHMS || 'HS256')
    .split(',')
    .map((algorithm) => algorithm.trim())
    .filter(Boolean);

  let decoded;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: allowedAlgorithms,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(
        new AppError('Your session has expired! Please log in again.', 401),
      );
    }
    return next(new AppError('Invalid or expired token', 401));
  }

  if (!decoded || !decoded.id) {
    return next(new AppError('Invalid or expired token', 401));
  }

  const user = await User.findById(decoded.id).select(
    '+isActive +passwordChangedAt',
  );

  if (!user || user.isActive === false) {
    return next(
      new AppError(
        'The user belonging to this token no longer exists or is inactive.',
        401,
      ),
    );
  }

  if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
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

const optionalAuth = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (decoded && decoded.id) {
      const user = await User.findById(decoded.id).select(
        '+isActive +passwordChangedAt',
      );
      if (user && user.isActive !== false) {
        req.user = user;
      }
    }
  } catch {
    // If token verification fails, proceed as unauthenticated
  }

  return next();
});

module.exports = {
  extractToken,
  requireAuth,
  optionalAuth,
  authorizeRoles,
};
