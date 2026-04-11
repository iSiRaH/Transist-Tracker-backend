const LocationLog = require("../models/LocationLog");
const {
  pickAllowedFields,
  toNumberOrOriginal,
} = require("../utils/sanitizeInput");

const sanitizeLocationLogPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    "tripId",
    "vehicleId",
    "location",
    "speed",
    "timestamp",
  ]);

  if (Object.prototype.hasOwnProperty.call(sanitized, "speed")) {
    sanitized.speed = toNumberOrOriginal(sanitized.speed);
  }

  if (
    Object.prototype.hasOwnProperty.call(sanitized, "location") &&
    sanitized.location &&
    typeof sanitized.location === "object" &&
    !Array.isArray(sanitized.location)
  ) {
    const location = pickAllowedFields(sanitized.location, ["coordinates"]);

    if (Array.isArray(location.coordinates)) {
      location.coordinates = location.coordinates
        .slice(0, 2)
        .map((coordinate) => toNumberOrOriginal(coordinate));
    }

    const normalizedLocation = { type: "Point" };

    if (Object.prototype.hasOwnProperty.call(location, "coordinates")) {
      normalizedLocation.coordinates = location.coordinates;
    }

    sanitized.location = normalizedLocation;
  }

  return sanitized;
};

const getAllLocationLogs = async (req, res) => {
  try {
    const locationLogs = await LocationLog.find().sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      count: locationLogs.length,
      locationLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch location logs",
    });
  }
};

const createNewLocationLog = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeLocationLogPayload(req.body);
    const locationLog = await LocationLog.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "Location log created successfully",
      locationLog,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create location log",
    });
  }
};

const getLocationLogById = async (req, res) => {
  try {
    const locationLog = await LocationLog.findById(req.params.id);

    if (!locationLog) {
      return res.status(404).json({
        success: false,
        message: "Location log not found",
      });
    }

    return res.status(200).json({
      success: true,
      locationLog,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid location log id",
    });
  }
};

const updateLocationLogById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeLocationLogPayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
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
      return res.status(404).json({
        success: false,
        message: "Location log not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location log updated successfully",
      locationLog,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update location log",
    });
  }
};

const deleteLocationLogById = async (req, res) => {
  try {
    const locationLog = await LocationLog.findByIdAndDelete(req.params.id);

    if (!locationLog) {
      return res.status(404).json({
        success: false,
        message: "Location log not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location log deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete location log",
    });
  }
};

module.exports = {
  getAllLocationLogs,
  createNewLocationLog,
  getLocationLogById,
  updateLocationLogById,
  deleteLocationLogById,
};
