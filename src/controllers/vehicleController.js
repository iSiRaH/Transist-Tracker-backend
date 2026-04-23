const Vehicle = require('../models/Vehicle');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
  toBooleanOrOriginal,
} = require('../utils/sanitizeInput');

const sanitizeVehiclePayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    'vehicleNumber',
    'routeId',
    'driverId',
    'capacity',
    'type',
    'isActive',
  ]);

  const normalized = trimStringFields(sanitized, ['vehicleNumber', 'type']);

  if (Object.prototype.hasOwnProperty.call(normalized, 'capacity')) {
    normalized.capacity = toNumberOrOriginal(normalized.capacity);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'isActive')) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllVehicles = catchAsync(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: vehicles.length,
    vehicles,
  });
});

const createNewVehicle = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeVehiclePayload(req.body);
  const vehicle = await Vehicle.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    vehicle,
  });
});

const getVehicleById = catchAsync(async (req, res, next) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return next(new AppError('Vehicle not found', 404));
  }

  return res.status(200).json({
    success: true,
    vehicle,
  });
});

const updateVehicleById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeVehiclePayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    sanitizedPayload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!vehicle) {
    return next(new AppError('Vehicle not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Vehicle updated successfully',
    vehicle,
  });
});

const deleteVehicleById = catchAsync(async (req, res, next) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

  if (!vehicle) {
    return next(new AppError('Vehicle not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Vehicle deleted successfully',
  });
});

module.exports = {
  getAllVehicles,
  createNewVehicle,
  getVehicleById,
  updateVehicleById,
  deleteVehicleById,
};
