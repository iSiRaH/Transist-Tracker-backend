const express = require("express");
const {
  getAllUsers,
  createNewUser,
  getUserById,
  updateUserById,
  deleteUserById,
} = require("../controllers/userController");

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", createNewUser);
router.get("/:id", getUserById);
router.put("/:id", updateUserById);
router.delete("/:id", deleteUserById);

module.exports = router;
