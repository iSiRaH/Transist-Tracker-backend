const express = require('express');
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
} = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// General Auth Routes
router.post('/signup', signup);
router.post('/login', login);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password', resetPassword);
router.patch('/reset-password/:token', resetPassword);

// User-Specific Auth Routes
router.post('/user/signup', userSignup);
router.post('/user/login', userLogin);

// Driver-Specific Auth Routes
router.post('/driver/signup', driverSignup);
router.post('/driver/login', driverLogin);

// Admin-Specific Auth Routes
router.post('/admin/signup', adminSignup);
router.post('/admin/login', adminLogin);

// User/Driver/Admin Profile Route
router.get('/me', requireAuth, getUserInfo);

module.exports = router;
