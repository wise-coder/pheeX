const express = require("express");
const { body, param } = require("express-validator");

const handleValidation = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { getCommentsForImage, addComment } = require("../controllers/commentController");

const router = express.Router();

router.get(
  "/image/:imageId",
  protect,
  [param("imageId").isMongoId().withMessage("Invalid image ID.")],
  handleValidation,
  getCommentsForImage
);

router.post(
  "/",
  protect,
  [
    body("imageId").isMongoId().withMessage("Invalid image ID."),
    body("text").trim().isLength({ min: 1, max: 240 }).withMessage("Comment must be 1-240 characters.")
  ],
  handleValidation,
  addComment
);

module.exports = router;
