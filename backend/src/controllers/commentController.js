const Comment = require("../models/Comment");
const Image = require("../models/Image");
const createNotification = require("../utils/notification");
const { ensureAlbumAccess } = require("../utils/access");
const Album = require("../models/Album");
const { serializePublicUser } = require("../utils/presence");

const getCommentsForImage = async (req, res) => {
  const image = await Image.findById(req.params.imageId);

  if (!image) {
    return res.status(404).json({ message: "Image not found." });
  }

  const album = await Album.findById(image.albumId);
  ensureAlbumAccess(album, req.user);

  const comments = await Comment.find({ imageId: image._id })
    .populate("userId", "username profileImage lastSeenAt")
    .sort({ createdAt: 1 });

  return res.json({
    comments: comments.map((comment) => ({
      _id: comment._id,
      text: comment.text,
      timestamp: comment.timestamp,
      createdAt: comment.createdAt,
      user: serializePublicUser(comment.userId)
    }))
  });
};

const addComment = async (req, res) => {
  const image = await Image.findById(req.body.imageId).populate("uploadedBy", "username profileImage lastSeenAt");

  if (!image) {
    return res.status(404).json({ message: "Image not found." });
  }

  const album = await Album.findById(image.albumId);
  ensureAlbumAccess(album, req.user);

  const comment = await Comment.create({
    userId: req.user._id,
    imageId: image._id,
    text: req.body.text.trim()
  });

  image.commentsCount += 1;
  await image.save();

  await createNotification({
    recipientId: image.uploadedBy._id,
    actorId: req.user._id,
    type: "comment",
    message: `${req.user.username} commented on your image.`,
    albumId: image.albumId,
    imageId: image._id
  });

  await comment.populate("userId", "username profileImage lastSeenAt");

  return res.status(201).json({
    comment: {
      _id: comment._id,
      text: comment.text,
      timestamp: comment.timestamp,
      createdAt: comment.createdAt,
      user: serializePublicUser(comment.userId)
    },
    commentsCount: image.commentsCount
  });
};

module.exports = {
  getCommentsForImage,
  addComment
};
