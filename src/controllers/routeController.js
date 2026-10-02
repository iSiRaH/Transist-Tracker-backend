const Route = require('../models/Routes');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
  toBooleanOrOriginal,
} = require('../utils/sanitizeInput');

const sanitizeRouteLocation = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const location = pickAllowedFields(value, ['name', 'lat', 'lng']);
  const normalized = trimStringFields(location, ['name']);

  if (Object.prototype.hasOwnProperty.call(normalized, 'lat')) {
    normalized.lat = toNumberOrOriginal(normalized.lat);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'lng')) {
    normalized.lng = toNumberOrOriginal(normalized.lng);
  }

  return normalized;
};

const sanitizeStops = (value) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .filter((stop) => stop && typeof stop === 'object' && !Array.isArray(stop))
    .map((stop) => {
      const sanitizedStop = pickAllowedFields(stop, [
        'name',
        'lat',
        'lng',
        'order',
      ]);
      const normalizedStop = trimStringFields(sanitizedStop, ['name']);

      if (Object.prototype.hasOwnProperty.call(normalizedStop, 'lat')) {
        normalizedStop.lat = toNumberOrOriginal(normalizedStop.lat);
      }

      if (Object.prototype.hasOwnProperty.call(normalizedStop, 'lng')) {
        normalizedStop.lng = toNumberOrOriginal(normalizedStop.lng);
      }

      if (Object.prototype.hasOwnProperty.call(normalizedStop, 'order')) {
        normalizedStop.order = toNumberOrOriginal(normalizedStop.order);
      }

      return normalizedStop;
    });
};

const sanitizeRoutePayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'routeNumber',
    'routeName',
    'startLocation',
    'endLocation',
    'stops',
    'distanceKm',
    'estimatedDurationMin',
    'isActive',
  ]);

  const normalized = trimStringFields(sanitized, ['routeNumber', 'routeName']);

  if (Object.prototype.hasOwnProperty.call(normalized, 'startLocation')) {
    normalized.startLocation = sanitizeRouteLocation(normalized.startLocation);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'endLocation')) {
    normalized.endLocation = sanitizeRouteLocation(normalized.endLocation);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'stops')) {
    normalized.stops = sanitizeStops(normalized.stops);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'distanceKm')) {
    normalized.distanceKm = toNumberOrOriginal(normalized.distanceKm);
  }

  if (
    Object.prototype.hasOwnProperty.call(normalized, 'estimatedDurationMin')
  ) {
    normalized.estimatedDurationMin = toNumberOrOriginal(
      normalized.estimatedDurationMin,
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'isActive')) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllRoutes = catchAsync(async (req, res) => {
  const routes = await Route.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: routes.length,
    routes,
  });
});

const createNewRoute = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeRoutePayload(req.body);
  const route = await Route.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'Route created successfully',
    route,
  });
});

const getRouteById = catchAsync(async (req, res, next) => {
  const route = await Route.findById(req.params.id);

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  return res.status(200).json({
    success: true,
    route,
  });
});

const updateRouteById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeRoutePayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const route = await Route.findByIdAndUpdate(req.params.id, sanitizedPayload, {
    new: true,
    runValidators: true,
  });

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Route updated successfully',
    route,
  });
});

const deleteRouteById = catchAsync(async (req, res, next) => {
  const route = await Route.findByIdAndDelete(req.params.id);

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Route deleted successfully',
  });
});

module.exports = {
  getAllRoutes,
  createNewRoute,
  getRouteById,
  updateRouteById,
  deleteRouteById,
};
