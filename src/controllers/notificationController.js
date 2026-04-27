const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  trimStringFields,
  toBooleanOrOriginal,
} = require('../utils/sanitizeInput');

const sanitizeNotificationPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'userId',
    'title',
    'message',
    'type',
    'isRead',
  ]);

  const normalized = trimStringFields(sanitized, ['title', 'message', 'type']);

  if (Object.prototype.hasOwnProperty.call(normalized, 'isRead')) {
    normalized.isRead = toBooleanOrOriginal(normalized.isRead);
  }

  return normalized;
};

const getAllNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: notifications.length,
    notifications,
  });
});

const createNewNotification = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeNotificationPayload(req.body);
  const notification = await Notification.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    notification,
  });
});

const getNotificationById = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  return res.status(200).json({
    success: true,
    notification,
  });
});

const updateNotificationById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeNotificationPayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
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
    return next(new AppError('Notification not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Notification updated successfully',
    notification,
  });
});

const deleteNotificationById = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

module.exports = {
  getAllNotifications,
  createNewNotification,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
};
