const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.route("/health").get(async (req, res) => {
  try {
    const { db } = mongoose.connection;

    if (!db) {
      return res.status(503).json({ status: "unhealthy", db: "down" });
    }

    await db.admin().ping();

    return res.status(200).json({ status: "healthy", db: "up" });
  } catch (error) {
    return res.status(503).json({ status: "unhealthy", db: "down" });
  }
});

module.exports = router;
