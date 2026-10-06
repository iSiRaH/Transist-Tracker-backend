const assert = require('assert');
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
} = require('../src/controllers/authController');
const {
  createNewUser,
  deactivateUserById,
  reactivateUserById,
} = require('../src/controllers/userController');
const { requireAuth } = require('../src/middlewares/authMiddleware');
const User = require('../src/models/User');

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

  // 12. Test admin signup
  {
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
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
