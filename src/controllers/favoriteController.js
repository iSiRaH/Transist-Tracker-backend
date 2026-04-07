const Favorite = require("../models/Favorite");

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
    const favorite = await Favorite.create(req.body);

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
    const favorite = await Favorite.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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
