const jwt = require('jsonwebtoken');
const User = require('../models/User');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  profileImage: user.profileImage,
  isActive: user.isActive,
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user: sanitizeUser(user),
    },
  });
};

const isValidEmail = (email) => {
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
  const { name, email, password, passwordConfirm } = req.body;

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

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    passwordConfirm,
  });

  createSendToken(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

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
    '+password',
  );

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  const passwordMatched = await user.comparePassword(password, user.password);

  if (!passwordMatched) {
    return next(new AppError('Invalid email or password', 401));
  }

  createSendToken(user, 200, res);
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

const forgetPassword = async (req, res) => {};

const resetPassword = async (req, res) => {};

module.exports = {
  signup,
  login,
  getUserInfo,
  forgetPassword,
  resetPassword,
};
