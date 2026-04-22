const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("actor", "username profileImage")
    .populate("album", "title")
    .populate("image", "url")
    .sort({ createdAt: -1 })
    .limit(20);

  return res.json({
    notifications
  });
};

const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } }
  );

  return res.json({ message: "Notifications marked as read." });
};

const deleteNotification = async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.notificationId,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ message: "Notification not found." });
  }

  await notification.deleteOne();

  return res.json({ message: "Notification deleted." });
};

module.exports = {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification
};
