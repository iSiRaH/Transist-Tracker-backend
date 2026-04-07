const express = require("express");

const {
  getAllVehicles,
  createNewVehicle,
  getVehicleById,
  updateVehicleById,
  deleteVehicleById,
} = require("../controllers/vehicleController");

const router = express.Router();

router.get("/", getAllVehicles);
router.post("/", createNewVehicle);
router.get("/:id", getVehicleById);
router.put("/:id", updateVehicleById);
router.delete("/:id", deleteVehicleById);

module.exports = router;
