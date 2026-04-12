const Notification = require("../models/Notification");
const {
  pickAllowedFields,
  trimStringFields,
  toBooleanOrOriginal,
} = require("../utils/sanitizeInput");

const sanitizeNotificationPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    "userId",
    "title",
    "message",
    "type",
    "isRead",
  ]);

  const normalized = trimStringFields(sanitized, ["title", "message", "type"]);

  if (Object.prototype.hasOwnProperty.call(normalized, "isRead")) {
    normalized.isRead = toBooleanOrOriginal(normalized.isRead);
  }

  return normalized;
};

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

const createNewNotification = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeNotificationPayload(req.body);
    const notification = await Notification.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create notification",
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification id",
    });
  }
};

const updateNotificationById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeNotificationPayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      sanitizedPayload,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

const deleteNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

module.exports = {
  getAllNotifications,
  createNewNotification,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
};
