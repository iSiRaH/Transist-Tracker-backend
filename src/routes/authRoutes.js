const express = require('express');
const {
  signup,
  login,
  userSignup,
  userLogin,
  driverSignup,
  driverLogin,
  getUserInfo,
} = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// General Auth Routes
router.post('/signup', signup);
router.post('/login', login);

// User-Specific Auth Routes
router.post('/user/signup', userSignup);
router.post('/user/login', userLogin);

// Driver-Specific Auth Routes
router.post('/driver/signup', driverSignup);
router.post('/driver/login', driverLogin);

// User/Driver Profile Route
router.get('/me', requireAuth, getUserInfo);

module.exports = router;
