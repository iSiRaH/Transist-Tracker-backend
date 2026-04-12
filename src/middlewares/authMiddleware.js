const jwt = require("jsonwebtoken");
const User = require("../models/User");

const extractBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const match = authorizationHeader.match(
    /^Bearer\s+([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)$/,
  );

  return match ? match[1] : null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization) || "invalid";

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Server JWT configuration is missing",
      });
    }

    const allowedAlgorithms = (process.env.JWT_ALGORITHMS || "HS256")
      .split(",")
      .map((algorithm) => algorithm.trim())
      .filter(Boolean);

    const decoded = jwt.verify(token, secret, {
      algorithms: allowedAlgorithms,
    });

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this resource",
      });
    }

    return next();
  };

module.exports = {
  requireAuth,
  authorizeRoles,
};
