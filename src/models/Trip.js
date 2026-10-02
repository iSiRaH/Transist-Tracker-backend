const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: 'Coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false },
);

const tripSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
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
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'paused'],
      default: 'active',
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    currentLocation: {
      type: pointSchema,
      required: true,
    },
    speed: {
      type: Number,
      default: 0,
      min: 0,
    },
    heading: {
      type: Number,
      min: 0,
      max: 360,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'trips',
  },
);

tripSchema.index({ currentLocation: '2dsphere' });
tripSchema.index({ status: 1, lastUpdated: -1 });

module.exports = mongoose.model('Trip', tripSchema);
