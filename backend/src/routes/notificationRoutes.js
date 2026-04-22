const express = require("express");

const { protect } = require("../middleware/auth");
const {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllNotificationsRead);
router.delete("/:notificationId", protect, deleteNotification);

module.exports = router;
