const Route = require("../models/Routes");

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
    const route = await Route.create(req.body);

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
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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
