const LocationLog = require("../models/LocationLog");

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
    const locationLog = await LocationLog.create(req.body);

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
    const locationLog = await LocationLog.findByIdAndUpdate(
      req.params.id,
      req.body,
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
