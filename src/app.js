const express = require("express");

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
const { createRateLimiter } = require("./middlewares/rateLimiter");

app.use(express.json());

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts. Please try again later.",
});

const protectedRouteRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again later.",
});

app.use("/api/v1", healthCheck);
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use(
  "/api/v1/vehicles",
  protectedRouteRateLimiter,
  requireAuth,
  vehicleRoutes,
);
app.use("/api/v1/users", protectedRouteRateLimiter, requireAuth, userRoutes);
app.use("/api/v1/routes", protectedRouteRateLimiter, requireAuth, routeRoutes);
app.use("/api/v1/trips", protectedRouteRateLimiter, requireAuth, tripRoutes);
app.use(
  "/api/v1/favorites",
  protectedRouteRateLimiter,
  requireAuth,
  favoriteRoutes,
);
app.use(
  "/api/v1/location-logs",
  protectedRouteRateLimiter,
  requireAuth,
  locationLogRoutes,
);
app.use(
  "/api/v1/notifications",
  protectedRouteRateLimiter,
  requireAuth,
  notificationRoutes,
);

module.exports = app;
