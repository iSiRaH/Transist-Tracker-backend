const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['bus', 'train'],
      default: 'bus',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'vehicles',
  },
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
