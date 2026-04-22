const mongoose = require("mongoose");

const Media = require("../models/Media");

const getMediaById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.mediaId)) {
    return res.status(404).end();
  }

  const media = await Media.findById(req.params.mediaId).select("fileName mimeType size data");

  if (!media) {
    return res.status(404).end();
  }

  res.set({
    "Content-Type": media.mimeType,
    "Content-Length": String(media.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": `inline; filename="${encodeURIComponent(media.fileName)}"`
  });

  return res.send(media.data);
};

module.exports = {
  getMediaById
};
