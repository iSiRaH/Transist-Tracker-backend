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

app.use(express.json());

app.use("/api/v1", healthCheck);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/vehicles", requireAuth, vehicleRoutes);
app.use("/api/v1/users", requireAuth, userRoutes);
app.use("/api/v1/routes", requireAuth, routeRoutes);
app.use("/api/v1/trips", requireAuth, tripRoutes);
app.use("/api/v1/favorites", requireAuth, favoriteRoutes);
app.use("/api/v1/location-logs", requireAuth, locationLogRoutes);
app.use("/api/v1/notifications", requireAuth, notificationRoutes);

module.exports = app;
