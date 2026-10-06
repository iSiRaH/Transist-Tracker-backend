const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  trimStringFields,
  toBooleanOrOriginal,
} = require('../utils/sanitizeInput');

const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }
  if (!email.includes('@')) {
    return false;
  }
  const atIndex = email.indexOf('@');
  const afterAt = email.substring(atIndex + 1);
  if (!afterAt.includes('.')) {
    return false;
  }
  if (atIndex === 0) {
    return false;
  }
  const lastDotIndex = email.lastIndexOf('.');
  if (lastDotIndex === email.length - 1) {
    return false;
  }
  const dotIndex = afterAt.indexOf('.');
  if (dotIndex === 0) {
    return false;
  }
  return true;
};

const sanitizeUserPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'name',
    'email',
    'password',
    'passwordConfirm',
    'role',
    'phone',
    'licenseNumber',
    'profileImage',
    'isActive',
  ]);

  const normalized = trimStringFields(sanitized, [
    'name',
    'email',
    'password',
    'passwordConfirm',
    'role',
    'phone',
    'licenseNumber',
    'profileImage',
  ]);

  if (Object.prototype.hasOwnProperty.call(normalized, 'isActive')) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllUsers = catchAsync(async (req, res) => {
  const filter = {};

  if (req.query && req.query.role) {
    filter.role = String(req.query.role).trim().toLowerCase();
  }

  if (req.query && req.query.isActive !== undefined) {
    filter.isActive = toBooleanOrOriginal(req.query.isActive);
  }

  const users = await User.find(filter)
    .select('+isActive')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

const createNewUser = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeUserPayload(req.body);

  if (
    !sanitizedPayload.name ||
    !sanitizedPayload.email ||
    !sanitizedPayload.password
  ) {
    return next(new AppError('Name, email and password are required', 400));
  }

  if (!isValidEmail(sanitizedPayload.email)) {
    return next(
      new AppError(
        "Invalid email format. Email must contain '@' and '.' with text after them",
        400,
      ),
    );
  }

  if (!sanitizedPayload.passwordConfirm) {
    sanitizedPayload.passwordConfirm = sanitizedPayload.password;
  }

  if (sanitizedPayload.password !== sanitizedPayload.passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  if (
    typeof sanitizedPayload.password !== 'string' ||
    sanitizedPayload.password.length < 8 ||
    sanitizedPayload.password.length > 64
  ) {
    return next(
      new AppError('Password must be between 8 and 64 characters', 400),
    );
  }

  if (
    sanitizedPayload.role &&
    !['user', 'driver', 'admin'].includes(sanitizedPayload.role)
  ) {
    return next(
      new AppError(
        'Invalid role. Allowed roles are "user", "driver", or "admin"',
        400,
      ),
    );
  }

  const normalizedEmail = sanitizedPayload.email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return next(new AppError('Email already exists', 409));
  }

  sanitizedPayload.email = normalizedEmail;

  const user = await User.create(sanitizedPayload);
  user.password = undefined;

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    user,
  });
});

const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+isActive');

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

  const user = await User.findById(req.params.id).select('+password +isActive');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const currentUserId = req.user && req.user._id ? req.user._id.toString() : '';
  const targetUserId = user._id.toString();

  // Safety guard: Admin cannot deactivate their own account via update
  if (sanitizedPayload.isActive === false && user.isActive !== false) {
    if (currentUserId === targetUserId) {
      return next(
        new AppError('Admins cannot deactivate their own account', 400),
      );
    }

    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id },
      });

      if (activeAdminCount === 0) {
        return next(
          new AppError('Cannot deactivate the only active admin account', 400),
        );
      }
    }

    user.passwordChangedAt = Date.now();
  }

  // Safety guard: Admin cannot demote themselves or the only active admin
  if (
    sanitizedPayload.role &&
    sanitizedPayload.role !== 'admin' &&
    user.role === 'admin'
  ) {
    if (currentUserId === targetUserId) {
      return next(new AppError('Admins cannot change their own role', 400));
    }

    const activeAdminCount = await User.countDocuments({
      role: 'admin',
      isActive: true,
      _id: { $ne: user._id },
    });

    if (activeAdminCount === 0) {
      return next(
        new AppError('Cannot demote the only active admin account', 400),
      );
    }
  }

  if (
    sanitizedPayload.role &&
    !['user', 'driver', 'admin'].includes(sanitizedPayload.role)
  ) {
    return next(
      new AppError(
        'Invalid role. Allowed roles are "user", "driver", or "admin"',
        400,
      ),
    );
  }

  Object.assign(user, sanitizedPayload);
  await user.save();
  user.password = undefined;

  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user,
  });
});

const deleteUserById = catchAsync(async (req, res, next) => {
  const currentUserId = req.user && req.user._id ? req.user._id.toString() : '';
  const targetId = req.params.id;

  if (currentUserId === targetId.toString()) {
    return next(new AppError('Admins cannot delete their own account', 400));
  }

  const user = await User.findById(targetId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({
      role: 'admin',
      isActive: true,
      _id: { $ne: user._id },
    });

    if (activeAdminCount === 0) {
      return next(
        new AppError('Cannot delete the only active admin account', 400),
      );
    }
  }

  await User.findByIdAndDelete(targetId);

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

const deactivateUserById = catchAsync(async (req, res, next) => {
  const currentUserId = req.user && req.user._id ? req.user._id.toString() : '';
  const targetId = req.params.id;

  // 1. Safety Guard: Admin cannot deactivate their own account
  if (currentUserId === targetId.toString()) {
    return next(
      new AppError('Admins cannot deactivate their own account', 400),
    );
  }

  const user = await User.findById(targetId).select('+isActive');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 2. Safety Guard: Already deactivated check
  if (user.isActive === false) {
    return next(new AppError('User account is already deactivated', 400));
  }

  // 3. Safety Guard: Cannot deactivate the only active admin account
  if (user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({
      role: 'admin',
      isActive: true,
      _id: { $ne: user._id },
    });

    if (activeAdminCount === 0) {
      return next(
        new AppError('Cannot deactivate the only active admin account', 400),
      );
    }
  }

  // Deactivate safely and invalidate any existing JWT sessions
  user.isActive = false;
  user.passwordChangedAt = Date.now();
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: `User '${user.name}' has been deactivated successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

const reactivateUserById = catchAsync(async (req, res, next) => {
  const targetId = req.params.id;

  const user = await User.findById(targetId).select('+isActive');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Safety Guard: Already active check
  if (user.isActive === true) {
    return next(new AppError('User account is already active', 400));
  }

  user.isActive = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: `User '${user.name}' has been reactivated successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

module.exports = {
  getAllUsers,
  createNewUser,
  getUserById,
  updateUserById,
  deleteUserById,
  deactivateUserById,
  reactivateUserById,
};
