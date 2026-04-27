const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  trimStringFields,
  toBooleanOrOriginal,
} = require('../utils/sanitizeInput');

const sanitizeUserPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'name',
    'email',
    'password',
    'role',
    'phone',
    'profileImage',
    'isActive',
  ]);

  const normalized = trimStringFields(sanitized, [
    'name',
    'email',
    'password',
    'role',
    'phone',
    'profileImage',
  ]);

  if (Object.prototype.hasOwnProperty.call(normalized, 'isActive')) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

const createNewUser = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeUserPayload(req.body);
  const user = await User.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    user,
  });
});

const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

const updateUserById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeUserPayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const user = await User.findById(req.params.id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  Object.assign(user, sanitizedPayload);
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user,
  });
});

const deleteUserById = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  getAllUsers,
  createNewUser,
  getUserById,
  updateUserById,
  deleteUserById,
};
