const Vehicle = require("../models/Vehicle");
const {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
  toBooleanOrOriginal,
} = require("../utils/sanitizeInput");

const sanitizeVehiclePayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    "vehicleNumber",
    "routeId",
    "driverId",
    "capacity",
    "type",
    "isActive",
  ]);

  const normalized = trimStringFields(sanitized, ["vehicleNumber", "type"]);

  if (Object.prototype.hasOwnProperty.call(normalized, "capacity")) {
    normalized.capacity = toNumberOrOriginal(normalized.capacity);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "isActive")) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
    });
  }
};

const createNewVehicle = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeVehiclePayload(req.body);
    const vehicle = await Vehicle.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create vehicle",
    });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle id",
    });
  }
};

const updateVehicleById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeVehiclePayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
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
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update vehicle",
    });
  }
};

const deleteVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete vehicle",
    });
  }
};

module.exports = {
  getAllVehicles,
  createNewVehicle,
  getVehicleById,
  updateVehicleById,
  deleteVehicleById,
};
