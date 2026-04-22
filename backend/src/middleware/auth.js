const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { touchUserPresence } = require("../utils/presence");

const getTokenFromHeader = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.split(" ")[1];
};

const attachUser = async (req, token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    const error = new Error("Authentication failed.");
    error.statusCode = 401;
    throw error;
  }

  await touchUserPresence(user);
  req.user = user;
};

const protect = async (req, res, next) => {
  const token = getTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing." });
  }

  await attachUser(req, token);
  return next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (token) {
      await attachUser(req, token);
    }
  } catch (error) {
    req.user = null;
  }

  return next();
};

module.exports = {
  protect,
  optionalAuth
};
