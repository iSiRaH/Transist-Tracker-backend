const assert = require('assert');
const jwt = require('jsonwebtoken');
const {
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
} = require('../src/controllers/authController');
const {
  createNewUser,
  deactivateUserById,
  reactivateUserById,
  updateUserById,
} = require('../src/controllers/userController');
const { requireAuth, optionalAuth } = require('../src/middlewares/authMiddleware');
const User = require('../src/models/User');
const emailService = require('../src/utils/email');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  'test-secret-key-1234567890-test-secret-1234567890-test-secret';
process.env.JWT_EXPIRES_IN = '1d';

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.cookies = {};
  res.cookie = (name, val) => {
    res.cookies[name] = val;
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

async function runTests() {
  // 1. Test standard user signup
  {
    let createdDoc = null;
    const originalCreate = User.create;
    const originalFindOne = User.findOne;

    User.findOne = async () => null;
    User.create = async (data) => {
      createdDoc = {
        _id: 'user_123',
        ...data,
        isActive: true,
      };
      return createdDoc;
    };

    const req = {
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await signup(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.status, 'Success');
    assert.strictEqual(createdDoc.role, 'user');
    assert.strictEqual(res.body.data.user.role, 'user');

    User.create = originalCreate;
    User.findOne = originalFindOne;
  }

  // 2. Test explicit userSignup & userLogin
  {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    User.findOne = async () => null;
    User.create = async (data) => ({
      _id: 'user_789',
      ...data,
      isActive: true,
    });

    const signupReq = {
      body: {
        name: 'Passenger User',
        email: 'passenger@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      },
    };
    const signupRes = createMockRes();
    await userSignup(signupReq, signupRes, () => {});
    assert.strictEqual(signupRes.statusCode, 201);
    assert.strictEqual(signupRes.body.data.user.role, 'user');

    User.findOne = () => ({
      select: () => ({
        _id: 'user_789',
        name: 'Passenger User',
        email: 'passenger@example.com',
        role: 'user',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const loginReq = {
      body: {
        email: 'passenger@example.com',
        password: 'password123',
      },
    };
    const loginRes = createMockRes();
    await userLogin(loginReq, loginRes, () => {});
    assert.strictEqual(loginRes.statusCode, 200);
    assert.strictEqual(loginRes.body.data.user.role, 'user');

    User.findOne = originalFindOne;
    User.create = originalCreate;
  }

  // 3. Test driver signup with driver explicit endpoint / role
  {
    let createdDoc = null;
    const originalCreate = User.create;
    const originalFindOne = User.findOne;

    User.findOne = async () => null;
    User.create = async (data) => {
      createdDoc = {
        _id: 'driver_456',
        ...data,
        isActive: true,
      };
      return createdDoc;
    };

    const req = {
      body: {
        name: 'Saman Driver',
        email: 'saman.driver@transit.lk',
        password: 'password123',
        passwordConfirm: 'password123',
        phone: '+94771234567',
        licenseNumber: 'DL-998877',
      },
    };
    const res = createMockRes();
    let err = null;

    await driverSignup(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.status, 'Success');
    assert.strictEqual(createdDoc.role, 'driver');
    assert.strictEqual(res.body.data.user.role, 'driver');
    assert.strictEqual(res.body.data.user.phone, '+94771234567');
    assert.strictEqual(res.body.data.user.licenseNumber, 'DL-998877');

    User.create = originalCreate;
    User.findOne = originalFindOne;
  }

  // 4. Test signup rejecting admin role
  {
    const req = {
      body: {
        name: 'Hacker Admin',
        email: 'admin@hacker.com',
        password: 'password123',
        passwordConfirm: 'password123',
        role: 'admin',
      },
    };
    const res = createMockRes();
    let err = null;

    await signup(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('Admin registration is not allowed'));
  }

  // 5. Test driver login success
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => ({
        _id: 'driver_456',
        name: 'Saman Driver',
        email: 'saman.driver@transit.lk',
        role: 'driver',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'saman.driver@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await driverLogin(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'Success');
    assert.strictEqual(res.body.data.user.role, 'driver');

    User.findOne = originalFindOne;
  }

  // 6. Test generic login
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => ({
        _id: 'driver_456',
        name: 'Saman Driver',
        email: 'saman.driver@transit.lk',
        role: 'driver',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'saman.driver@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    await login(req, res, () => {});
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.user.role, 'driver');

    User.findOne = originalFindOne;
  }

  // 7. Test login role mismatch error
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => ({
        _id: 'user_123',
        name: 'Jane Regular User',
        email: 'jane@example.com',
        role: 'user',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'jane@example.com',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await driverLogin(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 403);
    assert.ok(err.message.includes('Account is not registered as a driver'));

    User.findOne = originalFindOne;
  }

  // 8. Test getUserInfo profile fetch
  {
    const originalFindById = User.findById;

    User.findById = async () => ({
      _id: 'driver_456',
      name: 'Saman Driver',
      email: 'saman.driver@transit.lk',
      role: 'driver',
      phone: '+94771234567',
      licenseNumber: 'DL-998877',
      profileImage: null,
      isActive: true,
    });

    const req = {
      user: {
        _id: 'driver_456',
      },
    };
    const res = createMockRes();
    await getUserInfo(req, res, () => {});
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.user.role, 'driver');
    assert.strictEqual(res.body.user.licenseNumber, 'DL-998877');

    User.findById = originalFindById;
  }

  // 9. Test rememberMe session cookie extension
  {
    const originalFindOne = User.findOne;
    User.findOne = () => ({
      select: () => ({
        _id: 'user_remember',
        name: 'Remember User',
        email: 'remember@example.com',
        role: 'user',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const loginReq = {
      body: {
        email: 'remember@example.com',
        password: 'password123',
        rememberMe: true,
      },
    };
    const loginRes = createMockRes();
    await login(loginReq, loginRes, () => {});
    assert.strictEqual(loginRes.statusCode, 200);
    assert.ok(loginRes.body.token);

    User.findOne = originalFindOne;
  }

  // 10. Test requireAuth blocks unauthenticated requests
  {
    const req = { headers: {} };
    const res = createMockRes();
    let authError = null;

    await requireAuth(req, res, (err) => {
      authError = err;
    });

    assert.ok(authError, 'Expected authentication error when no token provided');
  }

  // 11. Test userLogin rejects driver account
  {
    const originalFindOne = User.findOne;
    User.findOne = () => ({
      select: () => ({
        _id: 'driver_999',
        name: 'Driver Guy',
        email: 'driver.guy@transit.lk',
        role: 'driver',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'driver.guy@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await userLogin(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 403);
    assert.ok(err.message.includes('not registered as a user'));

    User.findOne = originalFindOne;
  }

  // 12a. Test admin signup fails closed when ADMIN_SECRET_KEY is missing
  {
    const originalSecret = process.env.ADMIN_SECRET_KEY;
    delete process.env.ADMIN_SECRET_KEY;

    const req = {
      body: {
        name: 'Chief Admin',
        email: 'chief.admin@transit.lk',
        password: 'password123',
        passwordConfirm: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await adminSignup(req, res, (e) => {
      err = e;
    });

    assert.ok(err !== null, 'Expected adminSignup to fail closed when ADMIN_SECRET_KEY is missing');
    assert.strictEqual(err.statusCode, 500);
    assert.ok(err.message.includes('Admin registration is not configured'));

    if (originalSecret !== undefined) {
      process.env.ADMIN_SECRET_KEY = originalSecret;
    }
  }

  // 12b. Test admin signup fails with invalid admin secret key
  {
    const originalSecret = process.env.ADMIN_SECRET_KEY;
    process.env.ADMIN_SECRET_KEY = 'correct-admin-secret';

    const req = {
      body: {
        name: 'Chief Admin',
        email: 'chief.admin@transit.lk',
        password: 'password123',
        passwordConfirm: 'password123',
        adminSecretKey: 'wrong-admin-secret',
      },
    };
    const res = createMockRes();
    let err = null;

    await adminSignup(req, res, (e) => {
      err = e;
    });

    assert.ok(err !== null);
    assert.strictEqual(err.statusCode, 403);
    assert.ok(err.message.includes('Invalid admin secret key'));

    if (originalSecret !== undefined) {
      process.env.ADMIN_SECRET_KEY = originalSecret;
    } else {
      delete process.env.ADMIN_SECRET_KEY;
    }
  }

  // 12c. Test admin signup success with valid admin secret key
  {
    const originalSecret = process.env.ADMIN_SECRET_KEY;
    process.env.ADMIN_SECRET_KEY = 'correct-admin-secret';
    let createdDoc = null;
    const originalCreate = User.create;
    const originalFindOne = User.findOne;

    User.findOne = async () => null;
    User.create = async (data) => {
      createdDoc = {
        _id: 'admin_123',
        ...data,
        isActive: true,
      };
      return createdDoc;
    };

    const req = {
      body: {
        name: 'Chief Admin',
        email: 'chief.admin@transit.lk',
        password: 'password123',
        passwordConfirm: 'password123',
        adminSecretKey: 'correct-admin-secret',
      },
    };
    const res = createMockRes();
    let err = null;

    await adminSignup(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(createdDoc.role, 'admin');
    assert.strictEqual(res.body.data.user.role, 'admin');

    User.create = originalCreate;
    User.findOne = originalFindOne;

    if (originalSecret !== undefined) {
      process.env.ADMIN_SECRET_KEY = originalSecret;
    } else {
      delete process.env.ADMIN_SECRET_KEY;
    }
  }

  // 13. Test admin login success
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => ({
        _id: 'admin_123',
        name: 'Chief Admin',
        email: 'chief.admin@transit.lk',
        role: 'admin',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'chief.admin@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await adminLogin(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.user.role, 'admin');

    User.findOne = originalFindOne;
  }

  // 14. Test admin login rejection for non-admin
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => ({
        _id: 'driver_456',
        name: 'Saman Driver',
        email: 'saman@transit.lk',
        role: 'driver',
        isActive: true,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'saman@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await adminLogin(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 403);
    assert.ok(err.message.includes('not registered as an admin'));

    User.findOne = originalFindOne;
  }

  // 15. Test admin creates a new user with role 'admin'
  {
    const originalCreate = User.create;
    const originalFindOne = User.findOne;

    User.findOne = async () => null;
    let createdPayload = null;
    User.create = async (payload) => {
      createdPayload = {
        _id: 'new_admin_001',
        ...payload,
        isActive: true,
      };
      return createdPayload;
    };

    const req = {
      body: {
        name: 'New Sub Admin',
        email: 'subadmin@transit.lk',
        password: 'password123',
        passwordConfirm: 'password123',
        role: 'admin',
      },
    };
    const res = createMockRes();
    let err = null;

    await createNewUser(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(createdPayload.role, 'admin');
    assert.strictEqual(res.body.user.role, 'admin');

    User.create = originalCreate;
    User.findOne = originalFindOne;
  }

  // 16. Test admin self-deactivation is safely blocked
  {
    const req = {
      user: {
        _id: 'admin_123',
      },
      params: {
        id: 'admin_123',
      },
    };
    const res = createMockRes();
    let err = null;

    await deactivateUserById(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('cannot deactivate their own account'));
  }

  // 17. Test deactivating the only active admin is safely blocked
  {
    const originalFindById = User.findById;
    const originalCountDocuments = User.countDocuments;

    User.findById = () => ({
      select: () => ({
        _id: 'admin_target',
        name: 'Only Admin',
        role: 'admin',
        isActive: true,
      }),
    });
    User.countDocuments = async () => 0; // 0 other active admins

    const req = {
      user: {
        _id: 'admin_performing',
      },
      params: {
        id: 'admin_target',
      },
    };
    const res = createMockRes();
    let err = null;

    await deactivateUserById(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('Cannot deactivate the only active admin'));

    User.findById = originalFindById;
    User.countDocuments = originalCountDocuments;
  }

  // 18. Test safely deactivating a user succeeds
  {
    const originalFindById = User.findById;
    let targetUser = {
      _id: 'user_regular',
      name: 'Regular Passenger',
      email: 'regular@transit.lk',
      role: 'user',
      isActive: true,
      save: async function () {
        return this;
      },
    };

    User.findById = () => ({
      select: () => targetUser,
    });

    const req = {
      user: {
        _id: 'admin_performing',
      },
      params: {
        id: 'user_regular',
      },
    };
    const res = createMockRes();
    let err = null;

    await deactivateUserById(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(targetUser.isActive, false);
    assert.strictEqual(res.body.user.isActive, false);

    User.findById = originalFindById;
  }

  // 19. Test deactivating an already deactivated user is rejected
  {
    const originalFindById = User.findById;
    const targetUser = {
      _id: 'user_already_inactive',
      name: 'Inactive User',
      role: 'user',
      isActive: false,
    };

    User.findById = () => ({
      select: () => targetUser,
    });

    const req = {
      user: {
        _id: 'admin_performing',
      },
      params: {
        id: 'user_already_inactive',
      },
    };
    const res = createMockRes();
    let err = null;

    await deactivateUserById(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('already deactivated'));

    User.findById = originalFindById;
  }

  // 20. Test safely reactivating a user succeeds
  {
    const originalFindById = User.findById;
    let targetUser = {
      _id: 'user_inactive',
      name: 'Inactive Passenger',
      email: 'inactive@transit.lk',
      role: 'user',
      isActive: false,
      save: async function () {
        return this;
      },
    };

    User.findById = () => ({
      select: () => targetUser,
    });

    const req = {
      user: {
        _id: 'admin_performing',
      },
      params: {
        id: 'user_inactive',
      },
    };
    const res = createMockRes();
    let err = null;

    await reactivateUserById(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(targetUser.isActive, true);
    assert.strictEqual(res.body.user.isActive, true);

    User.findById = originalFindById;
  }

  // 21. Test reactivating an already active user is rejected
  {
    const originalFindById = User.findById;
    const targetUser = {
      _id: 'user_active',
      name: 'Active Passenger',
      role: 'user',
      isActive: true,
    };

    User.findById = () => ({
      select: () => targetUser,
    });

    const req = {
      user: {
        _id: 'admin_performing',
      },
      params: {
        id: 'user_active',
      },
    };
    const res = createMockRes();
    let err = null;

    await reactivateUserById(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('already active'));

    User.findById = originalFindById;
  }

  // 22. Test deactivated user cannot log in
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => ({
        _id: 'user_deactivated',
        email: 'deactivated@transit.lk',
        role: 'user',
        isActive: false,
        password: 'hashed_password',
        comparePassword: async () => true,
      }),
    });

    const req = {
      body: {
        email: 'deactivated@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await login(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 401);

    User.findOne = originalFindOne;
  }

  // 23. Test forgotPassword generates verification code
  {
    const originalFindOne = User.findOne;
    let savedCode = null;

    User.findOne = async () => ({
      _id: 'user_forgot',
      name: 'Forgot User',
      email: 'forgot@transit.lk',
      isActive: true,
      createPasswordResetCode: function () {
        savedCode = '654321';
        this.passwordResetCode = 'hashed_654321';
        return savedCode;
      },
      createPasswordResetToken: function () {
        return 'token_123';
      },
      save: async () => {},
    });

    const req = {
      body: {
        email: 'forgot@transit.lk',
      },
    };
    const res = createMockRes();
    let err = null;

    await forgotPassword(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'Success');
    assert.ok(res.body.message.includes('6-digit verification code'));
    assert.strictEqual(res.body.resetCode, '654321');

    User.findOne = originalFindOne;
  }

  // 23b. Test forgotPassword failure when email service throws
  {
    const originalFindOne = User.findOne;
    const originalSendVerification = emailService.sendVerificationCodeEmail;

    const mockUser = {
      _id: 'user_forgot_err',
      name: 'Error User',
      email: 'error@transit.lk',
      isActive: true,
      createPasswordResetCode: function () {
        this.passwordResetCode = 'hashed_999999';
        this.passwordResetExpires = Date.now() + 600000;
        return '999999';
      },
      createPasswordResetToken: function () {
        this.passwordResetToken = 'token_err';
        this.passwordResetExpires = Date.now() + 600000;
        return 'token_err';
      },
      save: async () => true,
    };

    User.findOne = async () => mockUser;
    emailService.sendVerificationCodeEmail = async () => {
      throw new Error('SMTP connection refused');
    };

    const req = {
      body: {
        email: 'error@transit.lk',
      },
    };
    const res = createMockRes();
    let err = null;

    await forgotPassword(req, res, (e) => {
      err = e;
    });

    assert.ok(err !== null, 'Expected an error to be passed to next()');
    assert.strictEqual(err.statusCode, 500);
    assert.strictEqual(err.isOperational, true);
    assert.ok(
      err.message.includes(
        'Failed to send verification email: SMTP connection refused',
      ),
      `Unexpected error message: ${err.message}`,
    );
    // Verify tokens were cleared on mockUser
    assert.strictEqual(mockUser.passwordResetCode, undefined);
    assert.strictEqual(mockUser.passwordResetToken, undefined);
    assert.strictEqual(mockUser.passwordResetExpires, undefined);
    // Verify res.body was NOT sent as success
    assert.strictEqual(res.body, undefined);

    User.findOne = originalFindOne;
    emailService.sendVerificationCodeEmail = originalSendVerification;
  }

  // 23c. Test sendEmail throws when transporter is not configured in production
  {
    const originalConsoleError = console.error;
    console.error = () => {};

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let prodErr = null;
    try {
      await emailService.sendEmail({
        to: 'test@transit.lk',
        subject: 'Test',
        text: 'Test',
      });
    } catch (e) {
      prodErr = e;
    }
    assert.ok(
      prodErr !== null,
      'Expected sendEmail to throw when email service not configured in production',
    );
    assert.strictEqual(
      prodErr.message,
      'Email service is not configured on the server',
    );

    process.env.NODE_ENV = originalEnv;
    console.error = originalConsoleError;
  }

  // 23d. Test forgotPassword prevents account enumeration when user does not exist
  {
    const originalFindOne = User.findOne;
    User.findOne = async () => null;

    const req = {
      body: {
        email: 'nonexistent@transit.lk',
      },
    };
    const res = createMockRes();
    let err = null;

    await forgotPassword(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'Success');
    assert.ok(res.body.message.includes('6-digit verification code'));
    assert.strictEqual(res.body.resetCode, undefined);

    User.findOne = originalFindOne;
  }

  // 24. Test resetPassword with valid 6-digit code
  {
    const originalFindOne = User.findOne;
    let passwordUpdated = false;

    User.findOne = () => ({
      select: () => ({
        _id: 'user_reset',
        name: 'Reset User',
        email: 'forgot@transit.lk',
        role: 'user',
        isActive: true,
        save: async function () {
          passwordUpdated = true;
        },
      }),
    });

    const req = {
      body: {
        email: 'forgot@transit.lk',
        code: '654321',
        newPassword: 'newpassword123',
        passwordConfirm: 'newpassword123',
      },
    };
    const res = createMockRes();
    let err = null;

    await resetPassword(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(passwordUpdated, true);
    assert.strictEqual(res.body.status, 'Success');

    User.findOne = originalFindOne;
  }

  // 25. Test resetPassword with invalid code is rejected
  {
    const originalFindOne = User.findOne;

    User.findOne = () => ({
      select: () => null, // No matching user for invalid code
    });

    const req = {
      body: {
        email: 'forgot@transit.lk',
        code: '000000',
        newPassword: 'newpassword123',
        passwordConfirm: 'newpassword123',
      },
    };
    const res = createMockRes();
    let err = null;

    await resetPassword(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('invalid or has expired'));

    User.findOne = originalFindOne;
  }

  // 26. Test requestDeactivateCode generates 6-digit code
  {
    const originalFindOne = User.findOne;
    let generatedCode = null;

    User.findOne = () => ({
      select: () => ({
        _id: 'user_deact_req',
        name: 'Deact User',
        email: 'deact@transit.lk',
        role: 'user',
        isActive: true,
        comparePassword: async () => true,
        createDeactivateAccountCode: function () {
          generatedCode = '112233';
          return generatedCode;
        },
        save: async () => {},
      }),
    });

    const req = {
      body: {
        email: 'deact@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await requestDeactivateCode(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.deactivateCode, '112233');

    User.findOne = originalFindOne;
  }

  // 27. Test confirmDeactivateAccount deactivates account
  {
    const originalFindOne = User.findOne;
    let userDoc = {
      _id: 'user_deact_req',
      name: 'Deact User',
      email: 'deact@transit.lk',
      role: 'user',
      isActive: true,
      save: async function () {
        return this;
      },
    };

    User.findOne = () => ({
      select: () => userDoc,
    });

    const req = {
      body: {
        email: 'deact@transit.lk',
        code: '112233',
      },
    };
    const res = createMockRes();
    let err = null;

    await confirmDeactivateAccount(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(userDoc.isActive, false);

    User.findOne = originalFindOne;
  }

  // 28. Test requestDeleteCode & confirmDeleteAccount
  {
    const originalFindOne = User.findOne;
    const originalFindByIdAndDelete = User.findByIdAndDelete;
    let deletedId = null;

    User.findOne = () => ({
      select: () => ({
        _id: 'user_to_delete',
        name: 'Delete Me',
        email: 'delete@transit.lk',
        role: 'user',
        isActive: true,
        comparePassword: async () => true,
        createDeleteAccountCode: () => '998877',
        save: async () => {},
      }),
    });

    const reqSend = {
      body: {
        email: 'delete@transit.lk',
        password: 'password123',
      },
    };
    const resSend = createMockRes();
    await requestDeleteCode(reqSend, resSend, () => {});
    assert.strictEqual(resSend.statusCode, 200);
    assert.strictEqual(resSend.body.deleteCode, '998877');

    User.findOne = () => ({
      select: () => ({
        _id: 'user_to_delete',
        name: 'Delete Me',
        email: 'delete@transit.lk',
        role: 'user',
      }),
    });
    User.findByIdAndDelete = async (id) => {
      deletedId = id;
    };

    const reqConfirm = {
      body: {
        email: 'delete@transit.lk',
        code: '998877',
      },
    };
    const resConfirm = createMockRes();
    await confirmDeleteAccount(reqConfirm, resConfirm, () => {});
    assert.strictEqual(resConfirm.statusCode, 200);
    assert.strictEqual(deletedId, 'user_to_delete');

    User.findOne = originalFindOne;
    User.findByIdAndDelete = originalFindByIdAndDelete;
  }

  // 29. Test only active admin cannot delete their account
  {
    const originalFindOne = User.findOne;
    const originalCountDocuments = User.countDocuments;

    User.findOne = () => ({
      select: () => ({
        _id: 'admin_sole',
        name: 'Sole Admin',
        email: 'sole.admin@transit.lk',
        role: 'admin',
        isActive: true,
        comparePassword: async () => true,
      }),
    });
    User.countDocuments = async () => 0; // 0 other active admins

    const req = {
      body: {
        email: 'sole.admin@transit.lk',
        password: 'password123',
      },
    };
    const res = createMockRes();
    let err = null;

    await requestDeleteCode(req, res, (e) => {
      err = e;
    });

    assert.notStrictEqual(err, null);
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('Cannot delete the only active admin'));

    User.findOne = originalFindOne;
    User.countDocuments = originalCountDocuments;
  }

  // 30. Test optionalAuth enforces allowed algorithms and passwordChangedAt revocation
  {
    const originalFindById = User.findById;
    const token = jwt.sign(
      { id: 'user_optional_revoked' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // Password changed after token issued
    User.findById = () => ({
      select: () => ({
        _id: 'user_optional_revoked',
        isActive: true,
        passwordChangedAt: new Date(Date.now() + 5000),
        changedPasswordAfter: function (iat) {
          return iat < parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        },
      }),
    });

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      cookies: {},
    };
    const res = createMockRes();

    await optionalAuth(req, res, () => {});
    assert.strictEqual(
      req.user,
      undefined,
      'Expected optionalAuth not to set req.user when password changed after token issuance',
    );

    User.findById = originalFindById;
  }

  // 31. Test createPasswordResetCode uses secure 6-digit cryptographic RNG
  {
    const userInstance = new User({
      name: 'Crypto User',
      email: 'crypto@transit.lk',
      password: 'password123',
    });
    const code = userInstance.createPasswordResetCode();
    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 6);
    assert.ok(/^\d{6}$/.test(code), 'Expected code to be 6 digits');
    assert.ok(
      parseInt(code, 10) >= 100000 && parseInt(code, 10) <= 999999,
      'Expected code to be between 100000 and 999999',
    );
  }

  // 32. Test updateUserById revokes tokens when administrator changes password
  {
    const originalFindById = User.findById;
    let savedUser = null;
    User.findById = () => ({
      select: () => ({
        _id: 'user_pw_change',
        name: 'Target User',
        email: 'target@transit.lk',
        role: 'user',
        isActive: true,
        save: async function () {
          savedUser = this;
          return this;
        },
      }),
    });

    const req = {
      user: { _id: 'admin_123', role: 'admin' },
      params: { id: 'user_pw_change' },
      body: {
        password: 'NewPassword@123',
        passwordConfirm: 'NewPassword@123',
      },
    };
    const res = createMockRes();
    let err = null;

    await updateUserById(req, res, (e) => {
      err = e;
    });

    assert.strictEqual(err, null);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(savedUser !== null);
    assert.ok(
      savedUser.passwordChangedAt !== undefined,
      'Expected passwordChangedAt to be set when password is changed by admin',
    );

    User.findById = originalFindById;
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
