const Trip = require("../models/Trip");
const {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
} = require("../utils/sanitizeInput");

const sanitizeCurrentLocation = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const location = pickAllowedFields(value, ["coordinates"]);

  if (Array.isArray(location.coordinates)) {
    location.coordinates = location.coordinates
      .slice(0, 2)
      .map((coordinate) => toNumberOrOriginal(coordinate));
  }

  const normalizedLocation = { type: "Point" };

  if (Object.prototype.hasOwnProperty.call(location, "coordinates")) {
    normalizedLocation.coordinates = location.coordinates;
  }

  return normalizedLocation;
};

const sanitizeTripPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    "vehicleId",
    "routeId",
    "driverId",
    "status",
    "startTime",
    "endTime",
    "currentLocation",
    "speed",
    "heading",
    "lastUpdated",
  ]);

  const normalized = trimStringFields(sanitized, ["status"]);

  if (Object.prototype.hasOwnProperty.call(normalized, "currentLocation")) {
    normalized.currentLocation = sanitizeCurrentLocation(
      normalized.currentLocation,
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "speed")) {
    normalized.speed = toNumberOrOriginal(normalized.speed);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "heading")) {
    normalized.heading = toNumberOrOriginal(normalized.heading);
  }

  return normalized;
};

const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trips",
    });
  }
};

const createNewTrip = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeTripPayload(req.body);
    const trip = await Trip.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create trip",
    });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid trip id",
    });
  }
};

const updateTripById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeTripPayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, sanitizedPayload, {
      new: true,
      runValidators: true,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update trip",
    });
  }
};

const deleteTripById = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete trip",
    });
  }
};

module.exports = {
  getAllTrips,
  createNewTrip,
  getTripById,
  updateTripById,
  deleteTripById,
};
