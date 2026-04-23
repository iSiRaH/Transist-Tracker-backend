const express = require('express');
const {
  getAllLocationLogs,
  createNewLocationLog,
  getLocationLogById,
  updateLocationLogById,
  deleteLocationLogById,
} = require('../controllers/locationLogController');
const { authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorizeRoles('driver', 'admin'), getAllLocationLogs);
router.post('/', authorizeRoles('driver', 'admin'), createNewLocationLog);
router.get('/:id', authorizeRoles('driver', 'admin'), getLocationLogById);
router.put('/:id', authorizeRoles('driver', 'admin'), updateLocationLogById);
router.delete('/:id', authorizeRoles('admin'), deleteLocationLogById);

module.exports = router;
