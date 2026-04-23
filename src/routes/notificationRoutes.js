const express = require('express');
const {
  getAllNotifications,
  createNewNotification,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
} = require('../controllers/notificationController');
const { authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorizeRoles('user', 'driver', 'admin'), getAllNotifications);
router.post('/', authorizeRoles('admin'), createNewNotification);
router.get(
  '/:id',
  authorizeRoles('user', 'driver', 'admin'),
  getNotificationById,
);
router.put(
  '/:id',
  authorizeRoles('user', 'driver', 'admin'),
  updateNotificationById,
);
router.delete('/:id', authorizeRoles('admin'), deleteNotificationById);

module.exports = router;
