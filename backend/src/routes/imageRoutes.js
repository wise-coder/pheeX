const express = require("express");
const { body, param, query } = require("express-validator");

const upload = require("../middleware/upload");
const handleValidation = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { createImage, getImages, getImageById, deleteImage } = require("../controllers/imageController");

const router = express.Router();

router.get(
  "/",
  protect,
  [
    query("albumId")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Album ID must be valid.")
  ],
  handleValidation,
  getImages
);

router.get(
  "/:imageId",
  protect,
  [param("imageId").isMongoId().withMessage("Invalid image ID.")],
  handleValidation,
  getImageById
);

router.post(
  "/",
  protect,
  upload.single("image"),
  [
    body("albumId").isMongoId().withMessage("Please choose a valid album."),
    body("caption")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 180 })
      .withMessage("Caption must be 180 characters or fewer.")
  ],
  handleValidation,
  createImage
);

router.delete(
  "/:imageId",
  protect,
  [param("imageId").isMongoId().withMessage("Invalid image ID.")],
  handleValidation,
  deleteImage
);

module.exports = router;
