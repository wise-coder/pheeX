const express = require("express");
const { body } = require("express-validator");

const upload = require("../middleware/upload");
const handleValidation = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const {
  register,
  login,
  getCurrentUser,
  getAccessCodeUsers,
  updateProfile,
  logout
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  upload.single("profileImage"),
  [
    body("username").trim().isLength({ min: 3, max: 24 }).withMessage("Username must be 3-24 characters."),
    body("email").isEmail().withMessage("Please provide a valid email."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    body("accessCode").trim().matches(/^\d{5}$/).withMessage("Access code must be exactly 5 digits.")
  ],
  handleValidation,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email."),
    body("password").notEmpty().withMessage("Password is required.")
  ],
  handleValidation,
  login
);

router.get("/me", protect, getCurrentUser);
router.get("/community", protect, getAccessCodeUsers);

router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  [
    body("username")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ min: 3, max: 24 })
      .withMessage("Username must be 3-24 characters."),
    body("email")
      .optional({ values: "falsy" })
      .isEmail()
      .withMessage("Please provide a valid email."),
    body("newPassword")
      .optional({ values: "falsy" })
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters.")
  ],
  handleValidation,
  updateProfile
);

router.post("/logout", protect, logout);

module.exports = router;
