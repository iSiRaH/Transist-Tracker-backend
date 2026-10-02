const express = require('express');
const {
  getAllUsers,
  createNewUser,
  getUserById,
  updateUserById,
  deleteUserById,
} = require('../controllers/userController');
const { authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authorizeRoles('admin'));

router.get('/', getAllUsers);
router.post('/', createNewUser);
router.get('/:id', getUserById);
router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);

module.exports = router;
