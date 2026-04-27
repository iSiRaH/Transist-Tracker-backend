const express = require('express');
const {
  getAllFavorites,
  createNewFavorite,
  getFavoriteById,
  updateFavoriteById,
  deleteFavoriteById,
} = require('../controllers/favoriteController');
const { authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorizeRoles('user', 'admin'), getAllFavorites);
router.post('/', authorizeRoles('user', 'admin'), createNewFavorite);
router.get('/:id', authorizeRoles('user', 'admin'), getFavoriteById);
router.put('/:id', authorizeRoles('user', 'admin'), updateFavoriteById);
router.delete('/:id', authorizeRoles('user', 'admin'), deleteFavoriteById);

module.exports = router;
