const Route = require("../models/Routes");
const {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
  toBooleanOrOriginal,
} = require("../utils/sanitizeInput");

const sanitizeRouteLocation = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const location = pickAllowedFields(value, ["name", "lat", "lng"]);
  const normalized = trimStringFields(location, ["name"]);

  if (Object.prototype.hasOwnProperty.call(normalized, "lat")) {
    normalized.lat = toNumberOrOriginal(normalized.lat);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "lng")) {
    normalized.lng = toNumberOrOriginal(normalized.lng);
  }

  return normalized;
};

const sanitizeStops = (value) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .filter((stop) => stop && typeof stop === "object" && !Array.isArray(stop))
    .map((stop) => {
      const sanitizedStop = pickAllowedFields(stop, [
        "name",
        "lat",
        "lng",
        "order",
      ]);
      const normalizedStop = trimStringFields(sanitizedStop, ["name"]);

      if (Object.prototype.hasOwnProperty.call(normalizedStop, "lat")) {
        normalizedStop.lat = toNumberOrOriginal(normalizedStop.lat);
      }

      if (Object.prototype.hasOwnProperty.call(normalizedStop, "lng")) {
        normalizedStop.lng = toNumberOrOriginal(normalizedStop.lng);
      }

      if (Object.prototype.hasOwnProperty.call(normalizedStop, "order")) {
        normalizedStop.order = toNumberOrOriginal(normalizedStop.order);
      }

      return normalizedStop;
    });
};

const sanitizeRoutePayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    "routeNumber",
    "routeName",
    "startLocation",
    "endLocation",
    "stops",
    "distanceKm",
    "estimatedDurationMin",
    "isActive",
  ]);

  const normalized = trimStringFields(sanitized, ["routeNumber", "routeName"]);

  if (Object.prototype.hasOwnProperty.call(normalized, "startLocation")) {
    normalized.startLocation = sanitizeRouteLocation(normalized.startLocation);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "endLocation")) {
    normalized.endLocation = sanitizeRouteLocation(normalized.endLocation);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "stops")) {
    normalized.stops = sanitizeStops(normalized.stops);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "distanceKm")) {
    normalized.distanceKm = toNumberOrOriginal(normalized.distanceKm);
  }

  if (
    Object.prototype.hasOwnProperty.call(normalized, "estimatedDurationMin")
  ) {
    normalized.estimatedDurationMin = toNumberOrOriginal(
      normalized.estimatedDurationMin,
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "isActive")) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch routes",
    });
  }
};

const createNewRoute = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeRoutePayload(req.body);
    const route = await Route.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "Route created successfully",
      route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create route",
    });
  }
};

const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    return res.status(200).json({
      success: true,
      route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid route id",
    });
  }
};

const updateRouteById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeRoutePayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      sanitizedPayload,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Route updated successfully",
      route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update route",
    });
  }
};

const deleteRouteById = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete route",
    });
  }
};

module.exports = {
  getAllRoutes,
  createNewRoute,
  getRouteById,
  updateRouteById,
  deleteRouteById,
};
