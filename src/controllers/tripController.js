const Trip = require('../models/Trip');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
} = require('../utils/sanitizeInput');

const sanitizeCurrentLocation = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const location = pickAllowedFields(value, ['coordinates']);

  if (Array.isArray(location.coordinates)) {
    location.coordinates = location.coordinates
      .slice(0, 2)
      .map((coordinate) => toNumberOrOriginal(coordinate));
  }

  const normalizedLocation = { type: 'Point' };

  if (Object.prototype.hasOwnProperty.call(location, 'coordinates')) {
    normalizedLocation.coordinates = location.coordinates;
  }

  return normalizedLocation;
};

const sanitizeTripPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'vehicleId',
    'routeId',
    'driverId',
    'status',
    'startTime',
    'endTime',
    'currentLocation',
    'speed',
    'heading',
    'lastUpdated',
  ]);

  const normalized = trimStringFields(sanitized, ['status']);

  if (Object.prototype.hasOwnProperty.call(normalized, 'currentLocation')) {
    normalized.currentLocation = sanitizeCurrentLocation(
      normalized.currentLocation,
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'speed')) {
    normalized.speed = toNumberOrOriginal(normalized.speed);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'heading')) {
    normalized.heading = toNumberOrOriginal(normalized.heading);
  }

  return normalized;
};

const getAllTrips = catchAsync(async (req, res) => {
  const trips = await Trip.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: trips.length,
    trips,
  });
});

const createNewTrip = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeTripPayload(req.body);
  const trip = await Trip.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'Trip created successfully',
    trip,
  });
});

const getTripById = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }

  return res.status(200).json({
    success: true,
    trip,
  });
});

const updateTripById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeTripPayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const trip = await Trip.findByIdAndUpdate(req.params.id, sanitizedPayload, {
    new: true,
    runValidators: true,
  });

  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Trip updated successfully',
    trip,
  });
});

const deleteTripById = catchAsync(async (req, res, next) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);

  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Trip deleted successfully',
  });
});

module.exports = {
  getAllTrips,
  createNewTrip,
  getTripById,
  updateTripById,
  deleteTripById,
};
