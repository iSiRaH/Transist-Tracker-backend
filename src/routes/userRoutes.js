const express = require('express');
const {
  getAllUsers,
  createNewUser,
  getUserById,
  updateUserById,
  deleteUserById,
  deactivateUserById,
  reactivateUserById,
} = require('../controllers/userController');
const {
  requireAuth,
  authorizeRoles,
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles('admin'));

router.get('/', getAllUsers);
router.post('/', createNewUser);
router.get('/:id', getUserById);
router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);

router.patch('/:id/deactivate', deactivateUserById);
router.patch('/:id/reactivate', reactivateUserById);

module.exports = router;
