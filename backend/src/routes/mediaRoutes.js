const express = require("express");

const { getMediaById } = require("../controllers/mediaController");

const router = express.Router();

router.get("/:mediaId", getMediaById);

module.exports = router;
