const express = require("express");

const {
  getAllVehicles,
  createNewVehicle,
  getVehicleById,
  updateVehicleById,
  deleteVehicleById,
} = require("../controllers/vehicleController");
const { authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authorizeRoles("user", "driver", "admin"), getAllVehicles);
router.post("/", authorizeRoles("admin"), createNewVehicle);
router.get("/:id", authorizeRoles("user", "driver", "admin"), getVehicleById);
router.put("/:id", authorizeRoles("admin"), updateVehicleById);
router.delete("/:id", authorizeRoles("admin"), deleteVehicleById);

module.exports = router;
