const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();

const healthCheck = require("./routes/healthCheck");
const authRoutes = require("./routes/authRoutes");
const { requireAuth } = require("./middlewares/authMiddleware");
const vehicleRoutes = require("./routes/vehicleRoutes");
const userRoutes = require("./routes/userRoutes");
const routeRoutes = require("./routes/routeRoutes");
const tripRoutes = require("./routes/tripRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const locationLogRoutes = require("./routes/locationLogRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use(express.json());

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

app.use("/api/v1", healthCheck);
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use(
  "/api/v1/vehicles",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  vehicleRoutes,
);
app.use(
  "/api/v1/users",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  userRoutes,
);
app.use(
  "/api/v1/routes",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  routeRoutes,
);
app.use(
  "/api/v1/trips",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  tripRoutes,
);
app.use(
  "/api/v1/favorites",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  favoriteRoutes,
);
app.use(
  "/api/v1/location-logs",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  locationLogRoutes,
);
app.use(
  "/api/v1/notifications",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  requireAuth,
  notificationRoutes,
);

module.exports = app;
