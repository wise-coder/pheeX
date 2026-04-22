const Album = require("../models/Album");
const Image = require("../models/Image");
const Comment = require("../models/Comment");
const Reaction = require("../models/Reaction");
const Notification = require("../models/Notification");
const createNotification = require("../utils/notification");
const getPagination = require("../utils/pagination");
const { getAccessibleAlbum, getOwnedImage, ensureAlbumAccess } = require("../utils/access");
const { saveUploadedFile, deleteStoredFile } = require("../utils/media");
const { serializePublicUser } = require("../utils/presence");

const sizes = ["small", "medium", "large"];

const groupItemsByField = (items, field) =>
  items.reduce((accumulator, item) => {
    const key = String(item[field]);

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});

const buildImagePayloads = async (images, viewerId = null) => {
  const imageIds = images.map((image) => image._id);

  const [comments, reactions] = await Promise.all([
    Comment.find({ imageId: { $in: imageIds } })
      .populate("userId", "username profileImage lastSeenAt")
      .sort({ createdAt: 1 })
      .lean(),
    Reaction.find({ imageId: { $in: imageIds } }).lean()
  ]);

  const commentsByImage = groupItemsByField(comments, "imageId");
  const reactionsByImage = groupItemsByField(reactions, "imageId");

  return images.map((image) => {
    const imageComments = commentsByImage[String(image._id)] || [];
    const imageReactions = reactionsByImage[String(image._id)] || [];
    const reactionSummary = imageReactions.reduce(
      (summary, reaction) => {
        summary[reaction.type] = (summary[reaction.type] || 0) + 1;
        return summary;
      },
      { like: 0, love: 0, fire: 0 }
    );
    const viewerReaction = viewerId
      ? imageReactions.find((reaction) => String(reaction.userId) === String(viewerId))?.type || null
      : null;

    return {
      _id: image._id,
      url: image.url,
      caption: image.caption,
      albumId: image.albumId,
      uploadedBy: serializePublicUser(image.uploadedBy),
      likes: image.likes,
      commentsCount: image.commentsCount,
      displaySize: image.displaySize,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
      reactionSummary,
      viewerReaction,
      comments: imageComments.map((comment) => ({
        _id: comment._id,
        text: comment.text,
        timestamp: comment.timestamp,
        createdAt: comment.createdAt,
        user: serializePublicUser(comment.userId)
      }))
    };
  });
};

const createImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please choose an image to upload." });
  }

  const album = await getAccessibleAlbum(req.body.albumId, req.user);
  let storedFile = null;

  try {
    storedFile = await saveUploadedFile(req.file, { folder: "images" });

    const image = await Image.create({
      url: storedFile.url,
      caption: req.body.caption?.trim() || "",
      albumId: album._id,
      uploadedBy: req.user._id,
      displaySize: sizes[Math.floor(Math.random() * sizes.length)]
    });

    album.images.unshift(image._id);
    album.coverImage = image.url;

    if (!album.contributors.some((contributorId) => String(contributorId) === String(req.user._id))) {
      album.contributors.push(req.user._id);
    }

    await album.save();

    await createNotification({
      recipientId: album.creator,
      actorId: req.user._id,
      type: "album_contribution",
      message: `${req.user.username} added a new image to ${album.title}.`,
      albumId: album._id,
      imageId: image._id
    });

    await image.populate("uploadedBy", "username profileImage lastSeenAt");

    const [payload] = await buildImagePayloads([image], req.user._id);

    return res.status(201).json({ image: payload });
  } catch (error) {
    if (storedFile?.url) {
      await deleteStoredFile(storedFile.url);
    }

    throw error;
  }
};

const getImages = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit, 9);
  const query = {};

  if (req.query.albumId) {
    query.albumId = req.query.albumId;
    const album = await Album.findById(req.query.albumId);
    ensureAlbumAccess(album, req.user);
  }

  const [images, total] = await Promise.all([
    Image.find(query)
      .populate("uploadedBy", "username profileImage lastSeenAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Image.countDocuments(query)
  ]);

  const items = await buildImagePayloads(images, req.user?._id);

  return res.json({
    images: items,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + images.length < total
    }
  });
};

const getImageById = async (req, res) => {
  const image = await Image.findById(req.params.imageId).populate("uploadedBy", "username profileImage lastSeenAt");

  if (!image) {
    return res.status(404).json({ message: "Image not found." });
  }

  const album = await Album.findById(image.albumId);
  ensureAlbumAccess(album, req.user);

  const [payload] = await buildImagePayloads([image], req.user?._id);
  return res.json({ image: payload });
};

const deleteImage = async (req, res) => {
  const { image, album } = await getOwnedImage(req.params.imageId, req.user);

  await deleteStoredFile(image.url);

  await Promise.all([
    Comment.deleteMany({ imageId: image._id }),
    Reaction.deleteMany({ imageId: image._id }),
    Notification.deleteMany({
      $or: [{ image: image._id }, { album: album._id, image: null }]
    })
  ]);

  album.images = album.images.filter((imageId) => String(imageId) !== String(image._id));

  const nextCover = await Image.findOne({
    albumId: album._id,
    _id: { $ne: image._id }
  })
    .sort({ createdAt: -1 })
    .select("url");

  album.coverImage = nextCover?.url || "";
  await album.save();
  await image.deleteOne();

  return res.json({ message: "Image deleted successfully." });
};

module.exports = {
  createImage,
  getImages,
  getImageById,
  deleteImage
};
