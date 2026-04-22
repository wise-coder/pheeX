const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["comment", "reaction", "album_contribution"],
      required: true
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      default: null
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
