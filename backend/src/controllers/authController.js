const User = require("../models/User");
const Notification = require("../models/Notification");
const generateToken = require("../utils/token");
const { saveUploadedFile, deleteStoredFile } = require("../utils/media");
const { serializeAuthenticatedUser, serializePublicUser } = require("../utils/presence");

const buildAuthResponse = async (user) => {
  const unreadNotifications = await Notification.countDocuments({
    recipient: user._id,
    read: false
  });

  return {
    token: generateToken(user._id),
    user: {
      ...serializeAuthenticatedUser(user),
      unreadNotifications
    }
  };
};

const register = async (req, res) => {
  const existingUser = await User.findOne({
    $or: [{ email: req.body.email.toLowerCase() }, { username: req.body.username.trim() }]
  });

  if (existingUser) {
    return res.status(400).json({ message: "A user with that email or username already exists." });
  }

  const user = await User.create({
    username: req.body.username.trim(),
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    profileImage: "",
    lastSeenAt: new Date(),
    accessCode: req.body.accessCode.trim()
  });

  let uploadedProfileImage = null;

  try {
    if (req.file) {
      uploadedProfileImage = await saveUploadedFile(req.file, { folder: "profiles" });
      user.profileImage = uploadedProfileImage.url;
      await user.save();
    }
  } catch (error) {
    if (uploadedProfileImage?.url) {
      await deleteStoredFile(uploadedProfileImage.url);
    }

    await user.deleteOne();
    throw error;
  }

  return res.status(201).json(await buildAuthResponse(user));
};

const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  user.lastSeenAt = new Date();
  await user.save();

  return res.json(await buildAuthResponse(user));
};

const getCurrentUser = async (req, res) => {
  const unreadNotifications = await Notification.countDocuments({
    recipient: req.user._id,
    read: false
  });

  return res.json({
    user: {
      ...serializeAuthenticatedUser(req.user),
      unreadNotifications
    }
  });
};

const getAccessCodeUsers = async (req, res) => {
  const users = await User.find({ accessCode: req.user.accessCode })
    .select("username profileImage lastSeenAt")
    .sort({ lastSeenAt: -1, username: 1 })
    .lean();

  return res.json({
    users: users.map(serializePublicUser)
  });
};

const updateProfile = async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const previousProfileImage = req.user.profileImage;

  if (username && username.trim() !== req.user.username) {
    const takenUsername = await User.findOne({
      username: username.trim(),
      _id: { $ne: req.user._id }
    });

    if (takenUsername) {
      return res.status(400).json({ message: "That username is already taken." });
    }

    req.user.username = username.trim();
  }

  if (email && email.toLowerCase() !== req.user.email) {
    const takenEmail = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id }
    });

    if (takenEmail) {
      return res.status(400).json({ message: "That email is already taken." });
    }

    req.user.email = email.toLowerCase();
  }

  if (newPassword) {
    const passwordMatches = currentPassword
      ? await req.user.comparePassword(currentPassword)
      : false;

    if (!passwordMatches) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    req.user.password = newPassword;
  }

  let uploadedProfileImage = null;

  if (req.file) {
    uploadedProfileImage = await saveUploadedFile(req.file, { folder: "profiles" });
    req.user.profileImage = uploadedProfileImage.url;
  }

  try {
    await req.user.save();
  } catch (error) {
    if (uploadedProfileImage?.url) {
      await deleteStoredFile(uploadedProfileImage.url);
    }

    throw error;
  }

  if (uploadedProfileImage?.url && previousProfileImage && previousProfileImage !== uploadedProfileImage.url) {
    await deleteStoredFile(previousProfileImage);
  }

  return res.json(await buildAuthResponse(req.user));
};

const logout = async (req, res) => {
  return res.json({ message: "Logged out successfully." });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  getAccessCodeUsers,
  updateProfile,
  logout
};
