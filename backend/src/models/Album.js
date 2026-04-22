const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      maxlength: 240,
      default: ""
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    contributors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image"
      }
    ],
    coverImage: {
      type: String,
      default: ""
    },
    accessCode: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{5}$/
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Album", albumSchema);
