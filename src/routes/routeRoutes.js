const express = require("express");
const {
  getAllRoutes,
  createNewRoute,
  getRouteById,
  updateRouteById,
  deleteRouteById,
} = require("../controllers/routeController");

const router = express.Router();

router.get("/", getAllRoutes);
router.post("/", createNewRoute);
router.get("/:id", getRouteById);
router.put("/:id", updateRouteById);
router.delete("/:id", deleteRouteById);

module.exports = router;
