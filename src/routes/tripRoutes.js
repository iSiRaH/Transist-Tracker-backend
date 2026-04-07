const express = require("express");
const {
  getAllTrips,
  createNewTrip,
  getTripById,
  updateTripById,
  deleteTripById,
} = require("../controllers/tripController");

const router = express.Router();

router.get("/", getAllTrips);
router.post("/", createNewTrip);
router.get("/:id", getTripById);
router.put("/:id", updateTripById);
router.delete("/:id", deleteTripById);

module.exports = router;
