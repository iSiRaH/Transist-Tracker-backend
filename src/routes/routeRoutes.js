const express = require('express');
const {
  getAllRoutes,
  createNewRoute,
  getRouteById,
  updateRouteById,
  deleteRouteById,
} = require('../controllers/routeController');
const { authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorizeRoles('user', 'driver', 'admin'), getAllRoutes);
router.post('/', authorizeRoles('admin'), createNewRoute);
router.get('/:id', authorizeRoles('user', 'driver', 'admin'), getRouteById);
router.put('/:id', authorizeRoles('admin'), updateRouteById);
router.delete('/:id', authorizeRoles('admin'), deleteRouteById);

module.exports = router;
