const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema(
  {
    stopId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const routeSchema = new mongoose.Schema(
  {
    routeNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    startLocation: {
      type: locationSchema,
      required: true,
    },
    endLocation: {
      type: locationSchema,
      required: true,
    },
    stops: {
      type: [stopSchema],
      default: [],
    },
    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDurationMin: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "routes",
  },
);

routeSchema.index({ routeNumber: 1, isActive: 1 });

module.exports = mongoose.model("Route", routeSchema);
