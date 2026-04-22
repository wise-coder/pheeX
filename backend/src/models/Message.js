const mongoose = require("mongoose");

const CHAT_RETENTION_DAYS = 30;

const messageSchema = new mongoose.Schema(
  {
    accessCode: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{5}$/
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000),
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ accessCode: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
