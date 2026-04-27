const express = require('express');
const { signup, login, getUserInfo } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, getUserInfo);

module.exports = router;
