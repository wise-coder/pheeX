const express = require("express");
const { body } = require("express-validator");

const handleValidation = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { toggleReaction } = require("../controllers/reactionController");

const router = express.Router();

router.post(
  "/toggle",
  protect,
  [
    body("imageId").isMongoId().withMessage("Invalid image ID."),
    body("type").isIn(["like", "love", "fire"]).withMessage("Reaction must be like, love, or fire.")
  ],
  handleValidation,
  toggleReaction
);

module.exports = router;
