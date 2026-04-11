const Favorite = require("../models/Favorite");
const { pickAllowedFields } = require("../utils/sanitizeInput");

const sanitizeFavoritePayload = (payload) =>
  pickAllowedFields(payload, ["userId", "routeId"]);

const getAllFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: favorites.length,
      favorites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
    });
  }
};

const createNewFavorite = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeFavoritePayload(req.body);
    const favorite = await Favorite.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "Favorite created successfully",
      favorite,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create favorite",
    });
  }
};

const getFavoriteById = async (req, res) => {
  try {
    const favorite = await Favorite.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    return res.status(200).json({
      success: true,
      favorite,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid favorite id",
    });
  }
};

const updateFavoriteById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeFavoritePayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const favorite = await Favorite.findByIdAndUpdate(
      req.params.id,
      sanitizedPayload,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favorite updated successfully",
      favorite,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update favorite",
    });
  }
};

const deleteFavoriteById = async (req, res) => {
  try {
    const favorite = await Favorite.findByIdAndDelete(req.params.id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favorite deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete favorite",
    });
  }
};

module.exports = {
  getAllFavorites,
  createNewFavorite,
  getFavoriteById,
  updateFavoriteById,
  deleteFavoriteById,
};
