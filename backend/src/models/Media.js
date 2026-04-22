const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["images", "profiles"],
      required: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    data: {
      type: Buffer,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Media", mediaSchema);
