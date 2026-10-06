const assert = require('assert');
const {
  signup,
  login,
  userSignup,
  userLogin,
  driverSignup,
  driverLogin,
  getUserInfo,
} = require('../src/controllers/authController');
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
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
