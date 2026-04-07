const express = require("express");
const {
  getAllNotifications,
  createNewNotification,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getAllNotifications);
router.post("/", createNewNotification);
router.get("/:id", getNotificationById);
router.put("/:id", updateNotificationById);
router.delete("/:id", deleteNotificationById);

module.exports = router;
