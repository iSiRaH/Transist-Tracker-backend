const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || null,
  licenseNumber: user.licenseNumber || null,
  profileImage: user.profileImage || null,
  isActive: user.isActive,
});

const signToken = (id, expiresIn = process.env.JWT_EXPIRES_IN || '7d') =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
  });

const createSendToken = (user, statusCode, res, message, rememberMe = false) => {
  const expiresIn = rememberMe
    ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'
    : process.env.JWT_EXPIRES_IN || '7d';

  const cookieDays = rememberMe
    ? Number(process.env.JWT_REMEMBER_COOKIE_EXPIRES_IN || 30)
    : Number(process.env.JWT_COOKIE_EXPIRES_IN || 7);

  const token = signToken(user._id, expiresIn);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  const responseBody = {
    status: 'Success',
    token,
    data: {
      user: sanitizeUser(user),
    },
  };

  if (message) {
    responseBody.message = message;
  }

  res.status(statusCode).json(responseBody);
};

const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }
  // Check for @ symbol
  if (!email.includes('@')) {
    return false;
  }

  // Check for . after @
  const atIndex = email.indexOf('@');
  const afterAt = email.substring(atIndex + 1);
  if (!afterAt.includes('.')) {
    return false;
  }

  // Check for text before @
  if (atIndex === 0) {
    return false;
  }

  // Check for text after .
  const lastDotIndex = email.lastIndexOf('.');
  if (lastDotIndex === email.length - 1) {
    return false;
  }

  // Check for text between @ and .
  const dotIndex = afterAt.indexOf('.');
  if (dotIndex === 0) {
    return false;
  }

  return true;
};

const signup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    role,
    phone,
    licenseNumber,
    profileImage,
  } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Name, email and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  let userRole = 'user';
  if (role) {
    const targetRole = String(role).trim().toLowerCase();
    if (targetRole === 'admin') {
      return next(
        new AppError(
          'Admin registration is not allowed via public endpoints',
          400,
        ),
      );
    }
    if (!['user', 'driver'].includes(targetRole)) {
      return next(
        new AppError('Invalid role. Allowed roles are "user" or "driver"', 400),
      );
    }
    userRole = targetRole;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return next(new AppError('Email already exists', 409));
  }

  const userData = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    passwordConfirm,
    role: userRole,
  };

  if (phone) userData.phone = String(phone).trim();
  if (licenseNumber) userData.licenseNumber = String(licenseNumber).trim();
  if (profileImage) userData.profileImage = String(profileImage).trim();

  const user = await User.create(userData);

  createSendToken(user, 201, res, null, Boolean(req.body.rememberMe));
});

const userSignup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    phone,
    profileImage,
    rememberMe,
  } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Name, email and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return next(new AppError('Email already exists', 409));
  }

  const userData = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    passwordConfirm,
    role: 'user',
  };

  if (phone) userData.phone = String(phone).trim();
  if (profileImage) userData.profileImage = String(profileImage).trim();

  const user = await User.create(userData);

  createSendToken(user, 201, res, null, Boolean(rememberMe));
});

const driverSignup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    phone,
    licenseNumber,
    profileImage,
    rememberMe,
  } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Name, email and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return next(new AppError('Email already exists', 409));
  }

  const userData = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    passwordConfirm,
    role: 'driver',
  };

  if (phone) userData.phone = String(phone).trim();
  if (licenseNumber) userData.licenseNumber = String(licenseNumber).trim();
  if (profileImage) userData.profileImage = String(profileImage).trim();

  const user = await User.create(userData);

  createSendToken(user, 201, res, null, Boolean(rememberMe));
});

const login = catchAsync(async (req, res, next) => {
  const { email, password, role, rememberMe } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+password +isActive',
  );

  if (!user || user.isActive === false) {
    return next(new AppError('Invalid email or password', 401));
  }

  const passwordMatched = await user.comparePassword(password, user.password);

  if (!passwordMatched) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (role) {
    const targetRole = String(role).trim().toLowerCase();
    if (user.role !== targetRole) {
      return next(
        new AppError(`Account is not registered as a ${targetRole}`, 403),
      );
    }
  }

  createSendToken(user, 200, res, null, Boolean(rememberMe));
});

const userLogin = catchAsync(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+password +isActive',
  );

  if (!user || user.isActive === false) {
    return next(new AppError('Invalid email or password', 401));
  }

  const passwordMatched = await user.comparePassword(password, user.password);

  if (!passwordMatched) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (user.role !== 'user') {
    return next(
      new AppError(
        'Account is not registered as a user. Please use driver login.',
        403,
      ),
    );
  }

  createSendToken(user, 200, res, null, Boolean(rememberMe));
});

const driverLogin = catchAsync(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+password +isActive',
  );

  if (!user || user.isActive === false) {
    return next(new AppError('Invalid email or password', 401));
  }

  const passwordMatched = await user.comparePassword(password, user.password);

  if (!passwordMatched) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (user.role !== 'driver') {
    return next(
      new AppError(
        'Account is not registered as a driver. Please use passenger login.',
        403,
      ),
    );
  }

  createSendToken(user, 200, res, null, Boolean(rememberMe));
});

const getUserInfo = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authorization is required', 401));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.status(200).json({
    success: true,
    user: sanitizeUser(user),
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address', 400));
  }

  if (!isValidEmail(email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || user.isActive === false) {
    return next(new AppError('There is no user with that email address', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'Success',
    message: 'Password reset token generated successfully',
    resetToken,
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const token =
    req.params.token ||
    req.body.token ||
    req.body.resetToken ||
    req.body.passwordResetToken;

  const password = req.body.newPassword || req.body.password;
  const passwordConfirm =
    req.body.confirmNewPassword ||
    req.body.passwordConfirm ||
    req.body.confirmPassword ||
    req.body.verifyPassword ||
    req.body.verifyingNewPassword;

  if (!token) {
    return next(new AppError('Password reset token is required', 400));
  }

  if (!password || !passwordConfirm) {
    return next(
      new AppError('New password and password confirmation are required', 400),
    );
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 64) {
    return next(
      new AppError('Password must be between 8 and 64 characters', 400),
    );
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(String(token).trim())
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user || user.isActive === false) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  createSendToken(user, 200, res, 'Password reset successfully');
});

module.exports = {
  signup,
  login,
  userSignup,
  userLogin,
  driverSignup,
  driverLogin,
  getUserInfo,
  forgotPassword,
  resetPassword,
};
