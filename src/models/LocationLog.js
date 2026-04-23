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

const locationLogSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    location: {
      type: pointSchema,
      required: true,
    },
    speed: {
      type: Number,
      default: 0,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'location_logs',
  },
);

locationLogSchema.index({ location: '2dsphere' });

const ttlDays = Number(process.env.LOCATION_LOG_TTL_DAYS || 0);
if (Number.isFinite(ttlDays) && ttlDays > 0) {
  locationLogSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: Math.floor(ttlDays * 24 * 60 * 60) },
  );
}

module.exports = mongoose.model('LocationLog', locationLogSchema);
