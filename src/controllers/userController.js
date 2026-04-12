const User = require("../models/User");
const {
  pickAllowedFields,
  trimStringFields,
  toBooleanOrOriginal,
} = require("../utils/sanitizeInput");

const sanitizeUserPayload = (payload) => {
  const sanitized = pickAllowedFields(payload, [
    "name",
    "email",
    "password",
    "role",
    "phone",
    "profileImage",
    "isActive",
  ]);

  const normalized = trimStringFields(sanitized, [
    "name",
    "email",
    "password",
    "role",
    "phone",
    "profileImage",
  ]);

  if (Object.prototype.hasOwnProperty.call(normalized, "isActive")) {
    normalized.isActive = toBooleanOrOriginal(normalized.isActive);
  }

  return normalized;
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const createNewUser = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeUserPayload(req.body);
    const user = await User.create(sanitizedPayload);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid user id",
    });
  }
};

const updateUserById = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeUserPayload(req.body);

    if (Object.keys(sanitizedPayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    Object.assign(user, sanitizedPayload);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  getAllUsers,
  createNewUser,
  getUserById,
  updateUserById,
  deleteUserById,
};
