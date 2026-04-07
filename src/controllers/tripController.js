const Trip = require("../models/Trip");

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
    const trip = await Trip.create(req.body);

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
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
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
