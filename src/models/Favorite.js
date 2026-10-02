const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'favorites',
  },
);

favoriteSchema.index({ userId: 1, routeId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
