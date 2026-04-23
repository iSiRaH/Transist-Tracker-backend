const LocationLog = require('../models/LocationLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  toNumberOrOriginal,
} = require('../utils/sanitizeInput');

const sanitizeLocationLogPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'tripId',
    'vehicleId',
    'location',
    'speed',
    'timestamp',
  ]);

  if (Object.prototype.hasOwnProperty.call(sanitized, 'speed')) {
    sanitized.speed = toNumberOrOriginal(sanitized.speed);
  }

  if (
    Object.prototype.hasOwnProperty.call(sanitized, 'location') &&
    sanitized.location &&
    typeof sanitized.location === 'object' &&
    !Array.isArray(sanitized.location)
  ) {
    const location = pickAllowedFields(sanitized.location, ['coordinates']);

    if (Array.isArray(location.coordinates)) {
      location.coordinates = location.coordinates
        .slice(0, 2)
        .map((coordinate) => toNumberOrOriginal(coordinate));
    }

    const normalizedLocation = { type: 'Point' };

    if (Object.prototype.hasOwnProperty.call(location, 'coordinates')) {
      normalizedLocation.coordinates = location.coordinates;
    }

    sanitized.location = normalizedLocation;
  }

  return sanitized;
};

const getAllLocationLogs = catchAsync(async (req, res) => {
  const locationLogs = await LocationLog.find().sort({ timestamp: -1 });

  return res.status(200).json({
    success: true,
    count: locationLogs.length,
    locationLogs,
  });
});

const createNewLocationLog = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeLocationLogPayload(req.body);
  const locationLog = await LocationLog.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'Location log created successfully',
    locationLog,
  });
});

const getLocationLogById = catchAsync(async (req, res, next) => {
  const locationLog = await LocationLog.findById(req.params.id);

  if (!locationLog) {
    return next(new AppError('Location log not found', 404));
  }

  return res.status(200).json({
    success: true,
    locationLog,
  });
});

const updateLocationLogById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeLocationLogPayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const locationLog = await LocationLog.findByIdAndUpdate(
    req.params.id,
    sanitizedPayload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!locationLog) {
    return next(new AppError('Location log not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Location log updated successfully',
    locationLog,
  });
});

const deleteLocationLogById = catchAsync(async (req, res, next) => {
  const locationLog = await LocationLog.findByIdAndDelete(req.params.id);

  if (!locationLog) {
    return next(new AppError('Location log not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Location log deleted successfully',
  });
});

module.exports = {
  getAllLocationLogs,
  createNewLocationLog,
  getLocationLogById,
  updateLocationLogById,
  deleteLocationLogById,
};
