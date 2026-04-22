const express = require("express");
const { body, param } = require("express-validator");

const { protect } = require("../middleware/auth");
const handleValidation = require("../middleware/validate");
const { createAlbum, getAlbums, getAlbumById, deleteAlbum } = require("../controllers/albumController");

const router = express.Router();

router.get("/", protect, getAlbums);

router.post(
  "/",
  protect,
  [
    body("title").trim().isLength({ min: 2, max: 80 }).withMessage("Title must be 2-80 characters."),
    body("description")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 240 })
      .withMessage("Description must be 240 characters or fewer.")
  ],
  handleValidation,
  createAlbum
);

router.get(
  "/:albumId",
  protect,
  [param("albumId").isMongoId().withMessage("Invalid album ID.")],
  handleValidation,
  getAlbumById
);

router.delete(
  "/:albumId",
  protect,
  [param("albumId").isMongoId().withMessage("Invalid album ID.")],
  handleValidation,
  deleteAlbum
);

module.exports = router;
