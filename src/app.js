const express = require("express");

const app = express();

const healthCheck = require("./routes/healthCheck");
const authRoutes = require("./routes/authRoutes");

app.use(express.json());

app.use("/api/v1", healthCheck);
app.use("/api/v1/auth", authRoutes);

module.exports = app;
