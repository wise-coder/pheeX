const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true
    },
    type: {
      type: String,
      enum: ["like", "love", "fire"],
      default: "like"
    }
  },
  {
    timestamps: true
  }
);

reactionSchema.index({ userId: 1, imageId: 1 }, { unique: true });

module.exports = mongoose.model("Reaction", reactionSchema);
