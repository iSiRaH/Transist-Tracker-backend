const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const emailService = require('../utils/email');
const { cleanupUserDependencies } = require('../utils/userCleanup');
const { withAdminLock } = require('../utils/adminLock');

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

const createSendToken = (
  user,
  statusCode,
  res,
  message,
  rememberMe = false,
) => {
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

  emailService
    .sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: user.role,
    })
    .catch(() => {});

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

  emailService
    .sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: 'user',
    })
    .catch(() => {});

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

  emailService
    .sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: 'driver',
    })
    .catch(() => {});

  createSendToken(user, 201, res, null, Boolean(rememberMe));
});

const adminSignup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    phone,
    profileImage,
    adminSecretKey,
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

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 64
  ) {
    return next(
      new AppError('Password must be between 8 and 64 characters', 400),
    );
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const expectedAdminKey = process.env.ADMIN_SECRET_KEY;
  if (!expectedAdminKey) {
    return next(
      new AppError('Admin registration is not configured on the server', 500),
    );
  }

  const providedKey = adminSecretKey || req.headers['x-admin-key'];
  if (!providedKey || providedKey !== expectedAdminKey) {
    return next(new AppError('Invalid admin secret key', 403));
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
    role: 'admin',
  };

  if (phone) userData.phone = String(phone).trim();
  if (profileImage) userData.profileImage = String(profileImage).trim();

  const user = await User.create(userData);

  emailService
    .sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: 'admin',
    })
    .catch(() => {});

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

const adminLogin = catchAsync(async (req, res, next) => {
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

  if (user.role !== 'admin') {
    return next(
      new AppError(
        'Account is not registered as an admin. Access denied.',
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
    return res.status(200).json({
      status: 'Success',
      message:
        'If an account with that email address exists, a 6-digit verification code has been sent.',
      data: {
        email: normalizedEmail,
      },
    });
  }

  const resetCode = user.createPasswordResetCode();
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendVerificationCodeEmail({
      to: user.email,
      name: user.name,
      code: resetCode,
      action: 'forgot-password',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `Failed to send verification email: ${err.message || 'There was an error sending the email'}. Please try again later.`,
        500,
      ),
    );
  }

  const responseData = {
    status: 'Success',
    message:
      'If an account with that email address exists, a 6-digit verification code has been sent.',
    data: {
      email: user.email,
    },
  };

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    responseData.resetCode = resetCode;
    responseData.resetToken = resetToken;
  }

  res.status(200).json(responseData);
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const code = req.body.code || req.body.resetCode || req.body.verificationCode;

  const token =
    (req.params && req.params.token) ||
    (req.body && req.body.token) ||
    (req.body && req.body.resetToken) ||
    (req.body && req.body.passwordResetToken);

  const password = req.body.newPassword || req.body.password;
  const passwordConfirm =
    req.body.confirmNewPassword ||
    req.body.passwordConfirm ||
    req.body.confirmPassword ||
    req.body.verifyPassword ||
    req.body.verifyingNewPassword;

  if (!code && !token) {
    return next(
      new AppError('Verification code or reset token is required', 400),
    );
  }

  if (!password || !passwordConfirm) {
    return next(
      new AppError('New password and password confirmation are required', 400),
    );
  }

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 64
  ) {
    return next(
      new AppError('Password must be between 8 and 64 characters', 400),
    );
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  let user;

  if (code) {
    if (!email) {
      return next(
        new AppError('Email is required when using a verification code', 400),
      );
    }
    const normalizedEmail = email.toLowerCase().trim();
    const hashedCode = crypto
      .createHash('sha256')
      .update(String(code).trim())
      .digest('hex');

    user = await User.findOne({
      email: normalizedEmail,
      passwordResetCode: hashedCode,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetCode +passwordResetExpires +isActive');
  } else if (token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(String(token).trim())
      .digest('hex');

    user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires +isActive');
  }

  if (!user || user.isActive === false) {
    return next(
      new AppError('Verification code or token is invalid or has expired', 400),
    );
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  emailService
    .sendSecurityAlertEmail({
      to: user.email,
      name: user.name,
      subject: 'Transit Tracker - Password Changed Successfully',
      message:
        'The password for your Transit Tracker account was recently changed. If you made this change, no further action is needed.',
    })
    .catch(() => {});

  createSendToken(user, 200, res, 'Password reset successfully');
});

const requestDeactivateCode = catchAsync(async (req, res, next) => {
  let user;

  if (req.user) {
    user = await User.findById(req.user._id).select('+isActive');
  } else {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new AppError(
          'Email and password are required to request account deactivation',
          400,
        ),
      );
    }
    const normalizedEmail = email.toLowerCase().trim();
    user = await User.findOne({ email: normalizedEmail }).select(
      '+password +isActive',
    );

    if (!user || user.isActive === false) {
      return next(new AppError('Invalid email or password', 401));
    }

    const passwordMatched = await user.comparePassword(password, user.password);
    if (!passwordMatched) {
      return next(new AppError('Invalid email or password', 401));
    }
  }

  if (!user || user.isActive === false) {
    return next(new AppError('Account is not active or user not found', 400));
  }

  if (user.role === 'admin') {
    const hasOtherAdmins = await withAdminLock(async () => {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id },
      });
      return activeAdminCount > 0;
    });

    if (!hasOtherAdmins) {
      return next(
        new AppError('Cannot deactivate the only active admin account', 400),
      );
    }
  }

  const code = user.createDeactivateAccountCode();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendVerificationCodeEmail({
      to: user.email,
      name: user.name,
      code,
      action: 'deactivate-account',
      warning:
        'Entering this code will deactivate your account and invalidate all active login sessions.',
    });
  } catch (err) {
    user.deactivateAccountCode = undefined;
    user.deactivateAccountExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `Failed to send verification email: ${err.message || 'There was an error sending the email'}. Please try again later.`,
        500,
      ),
    );
  }

  const responseData = {
    status: 'Success',
    message:
      'A 6-digit verification code to deactivate your account has been sent to your email address.',
    data: {
      email: user.email,
    },
  };

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    responseData.deactivateCode = code;
  }

  res.status(200).json(responseData);
});

const confirmDeactivateAccount = catchAsync(async (req, res, next) => {
  const code = req.body.code || req.body.verificationCode;
  const email = req.user ? req.user.email : req.body.email;

  if (!code) {
    return next(new AppError('Verification code is required', 400));
  }

  if (!email) {
    return next(
      new AppError('Email is required to verify account deactivation', 400),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedCode = crypto
    .createHash('sha256')
    .update(String(code).trim())
    .digest('hex');

  const user = await User.findOne({
    email: normalizedEmail,
    deactivateAccountCode: hashedCode,
    deactivateAccountExpires: { $gt: Date.now() },
  }).select('+deactivateAccountCode +deactivateAccountExpires +isActive');

  if (!user || user.isActive === false) {
    return next(
      new AppError('Verification code is invalid or has expired', 400),
    );
  }

  if (user.role === 'admin') {
    const canDeactivate = await withAdminLock(async () => {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id },
      });
      if (activeAdminCount === 0) {
        return false;
      }
      user.isActive = false;
      user.passwordChangedAt = Date.now();
      user.deactivateAccountCode = undefined;
      user.deactivateAccountExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return true;
    });

    if (!canDeactivate) {
      return next(
        new AppError('Cannot deactivate the only active admin account', 400),
      );
    }
  } else {
    user.isActive = false;
    user.passwordChangedAt = Date.now();
    user.deactivateAccountCode = undefined;
    user.deactivateAccountExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  emailService
    .sendSecurityAlertEmail({
      to: user.email,
      name: user.name,
      subject: 'Transit Tracker - Account Deactivated',
      message:
        'Your Transit Tracker account has been deactivated. You have been logged out of all active sessions. To reactivate your account in the future, please contact an administrator.',
    })
    .catch(() => {});

  res.status(200).json({
    status: 'Success',
    message: 'Your account has been deactivated successfully.',
  });
});

const requestDeleteCode = catchAsync(async (req, res, next) => {
  let user;

  if (req.user) {
    user = await User.findById(req.user._id).select('+isActive');
  } else {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new AppError(
          'Email and password are required to request account deletion',
          400,
        ),
      );
    }
    const normalizedEmail = email.toLowerCase().trim();
    user = await User.findOne({ email: normalizedEmail }).select(
      '+password +isActive',
    );

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const passwordMatched = await user.comparePassword(password, user.password);
    if (!passwordMatched) {
      return next(new AppError('Invalid email or password', 401));
    }
  }

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'admin') {
    const hasOtherAdmins = await withAdminLock(async () => {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id },
      });
      return activeAdminCount > 0;
    });

    if (!hasOtherAdmins) {
      return next(
        new AppError('Cannot delete the only active admin account', 400),
      );
    }
  }

  const code = user.createDeleteAccountCode();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendVerificationCodeEmail({
      to: user.email,
      name: user.name,
      code,
      action: 'delete-account',
      warning:
        'CRITICAL: Entering this code will permanently delete your account and all associated data. This action cannot be undone.',
    });
  } catch (err) {
    user.deleteAccountCode = undefined;
    user.deleteAccountExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `Failed to send verification email: ${err.message || 'There was an error sending the email'}. Please try again later.`,
        500,
      ),
    );
  }

  const responseData = {
    status: 'Success',
    message:
      'A 6-digit verification code to delete your account has been sent to your email address.',
    data: {
      email: user.email,
    },
  };

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    responseData.deleteCode = code;
  }

  res.status(200).json(responseData);
});

const confirmDeleteAccount = catchAsync(async (req, res, next) => {
  const code = req.body.code || req.body.verificationCode;
  const email = req.user ? req.user.email : req.body.email;

  if (!code) {
    return next(new AppError('Verification code is required', 400));
  }

  if (!email) {
    return next(
      new AppError('Email is required to verify account deletion', 400),
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedCode = crypto
    .createHash('sha256')
    .update(String(code).trim())
    .digest('hex');

  const user = await User.findOne({
    email: normalizedEmail,
    deleteAccountCode: hashedCode,
    deleteAccountExpires: { $gt: Date.now() },
  }).select('+deleteAccountCode +deleteAccountExpires');

  if (!user) {
    return next(
      new AppError('Verification code is invalid or has expired', 400),
    );
  }

  const userEmail = user.email;
  const userName = user.name;

  if (user.role === 'admin') {
    const canDelete = await withAdminLock(async () => {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id },
      });
      if (activeAdminCount === 0) {
        return false;
      }
      await cleanupUserDependencies(user._id);
      await User.findByIdAndDelete(user._id);
      return true;
    });

    if (!canDelete) {
      return next(
        new AppError('Cannot delete the only active admin account', 400),
      );
    }
  } else {
    await cleanupUserDependencies(user._id);
    await User.findByIdAndDelete(user._id);
  }

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  emailService
    .sendSecurityAlertEmail({
      to: userEmail,
      name: userName,
      subject: 'Transit Tracker - Account Deleted',
      message:
        'Your Transit Tracker account and all associated personal data have been permanently deleted.',
    })
    .catch(() => {});

  res.status(200).json({
    status: 'Success',
    message: 'Your account has been permanently deleted.',
  });
});

module.exports = {
  signup,
  login,
  userSignup,
  userLogin,
  driverSignup,
  driverLogin,
  adminSignup,
  adminLogin,
  getUserInfo,
  forgotPassword,
  resetPassword,
  requestDeactivateCode,
  confirmDeactivateAccount,
  requestDeleteCode,
  confirmDeleteAccount,
};
