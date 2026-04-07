const express = require("express");
const {
  getAllFavorites,
  createNewFavorite,
  getFavoriteById,
  updateFavoriteById,
  deleteFavoriteById,
} = require("../controllers/favoriteController");

const router = express.Router();

router.get("/", getAllFavorites);
router.post("/", createNewFavorite);
router.get("/:id", getFavoriteById);
router.put("/:id", updateFavoriteById);
router.delete("/:id", deleteFavoriteById);

module.exports = router;
