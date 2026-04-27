const Favorite = require('../models/Favorite');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { pickAllowedFields } = require('../utils/sanitizeInput');

const sanitizeFavoritePayload = (payload) =>
  pickAllowedFields(payload, ['userId', 'routeId']);

const getAllFavorites = catchAsync(async (req, res) => {
  const favorites = await Favorite.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: favorites.length,
    favorites,
  });
});

const createNewFavorite = catchAsync(async (req, res) => {
  const sanitizedPayload = sanitizeFavoritePayload(req.body);
  const favorite = await Favorite.create(sanitizedPayload);

  return res.status(201).json({
    success: true,
    message: 'Favorite created successfully',
    favorite,
  });
});

const getFavoriteById = catchAsync(async (req, res, next) => {
  const favorite = await Favorite.findById(req.params.id);

  if (!favorite) {
    return next(new AppError('Favorite not found', 404));
  }

  return res.status(200).json({
    success: true,
    favorite,
  });
});

const updateFavoriteById = catchAsync(async (req, res, next) => {
  const sanitizedPayload = sanitizeFavoritePayload(req.body);

  if (Object.keys(sanitizedPayload).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
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
    return next(new AppError('Favorite not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Favorite updated successfully',
    favorite,
  });
});

const deleteFavoriteById = catchAsync(async (req, res, next) => {
  const favorite = await Favorite.findByIdAndDelete(req.params.id);

  if (!favorite) {
    return next(new AppError('Favorite not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Favorite deleted successfully',
  });
});

module.exports = {
  getAllFavorites,
  createNewFavorite,
  getFavoriteById,
  updateFavoriteById,
  deleteFavoriteById,
};
