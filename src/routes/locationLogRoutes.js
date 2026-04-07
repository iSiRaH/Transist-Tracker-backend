const express = require("express");
const {
  getAllLocationLogs,
  createNewLocationLog,
  getLocationLogById,
  updateLocationLogById,
  deleteLocationLogById,
} = require("../controllers/locationLogController");

const router = express.Router();

router.get("/", getAllLocationLogs);
router.post("/", createNewLocationLog);
router.get("/:id", getLocationLogById);
router.put("/:id", updateLocationLogById);
router.delete("/:id", deleteLocationLogById);

module.exports = router;
