const User = require("../models/User");

const ACTIVE_WINDOW_MS = 10 * 60 * 1000;
const TOUCH_INTERVAL_MS = 60 * 1000;

const isUserActive = (lastSeenAt) => {
  if (!lastSeenAt) {
    return false;
  }

  return Date.now() - new Date(lastSeenAt).getTime() <= ACTIVE_WINDOW_MS;
};

const serializePublicUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    username: user.username,
    profileImage: user.profileImage || "",
    lastSeenAt: user.lastSeenAt || null,
    isActive: isUserActive(user.lastSeenAt)
  };
};

const serializeAuthenticatedUser = (user) => ({
  ...serializePublicUser(user),
  email: user.email,
  accessCode: user.accessCode || "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const touchUserPresence = async (user) => {
  if (!user) {
    return null;
  }

  const now = new Date();
  const lastSeenAt = user.lastSeenAt ? new Date(user.lastSeenAt) : null;

  if (!lastSeenAt || now.getTime() - lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
    await User.updateOne({ _id: user._id }, { $set: { lastSeenAt: now } });
    user.lastSeenAt = now;
  }

  return user;
};

module.exports = {
  ACTIVE_WINDOW_MS,
  isUserActive,
  serializePublicUser,
  serializeAuthenticatedUser,
  touchUserPresence
};
