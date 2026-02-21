const express = require("express");

const router = express.Router();

router.route("/health").get((req, res) => {
  res.status(200).json({ status: "Health Check OK" });
});

module.exports = router;
