const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      unique: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    profileImage: {
      type: String,
      default: ""
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    accessCode: {
      type: String,
      trim: true,
      match: /^\d{5}$/
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const isActive =
    this.lastSeenAt instanceof Date
      ? Date.now() - this.lastSeenAt.getTime() <= 10 * 60 * 1000
      : Boolean(this.lastSeenAt && Date.now() - new Date(this.lastSeenAt).getTime() <= 10 * 60 * 1000);

  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    profileImage: this.profileImage,
    lastSeenAt: this.lastSeenAt || null,
    isActive,
    accessCode: this.accessCode || "",
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model("User", userSchema);
