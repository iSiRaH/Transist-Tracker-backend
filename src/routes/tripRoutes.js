const express = require('express');
const {
  getAllTrips,
  createNewTrip,
  getTripById,
  updateTripById,
  deleteTripById,
} = require('../controllers/tripController');
const { authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorizeRoles('user', 'driver', 'admin'), getAllTrips);
router.post('/', authorizeRoles('driver', 'admin'), createNewTrip);
router.get('/:id', authorizeRoles('user', 'driver', 'admin'), getTripById);
router.put('/:id', authorizeRoles('driver', 'admin'), updateTripById);
router.delete('/:id', authorizeRoles('admin'), deleteTripById);

module.exports = router;
