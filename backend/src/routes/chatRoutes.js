const express = require("express");
const { query } = require("express-validator");

const { protect } = require("../middleware/auth");
const handleValidation = require("../middleware/validate");
const { getMessages } = require("../controllers/chatController");

const router = express.Router();

router.get(
  "/messages",
  protect,
  [
    query("limit")
      .optional({ values: "falsy" })
      .isInt({ min: 1, max: 80 })
      .withMessage("Chat history limit must be between 1 and 80.")
  ],
  handleValidation,
  getMessages
);

module.exports = router;
