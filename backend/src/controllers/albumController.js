const Album = require("../models/Album");
const Image = require("../models/Image");
const Comment = require("../models/Comment");
const Reaction = require("../models/Reaction");
const Notification = require("../models/Notification");
const getPagination = require("../utils/pagination");
const { ensureAlbumAccess } = require("../utils/access");
const { deleteStoredFile } = require("../utils/media");

const formatAlbum = (album) => ({
  _id: album._id,
  title: album.title,
  description: album.description,
  coverImage: album.coverImage,
  creator: album.creator,
  contributors: album.contributors,
  imageCount: album.images.length,
  contributorCount: album.contributors.length,
  createdAt: album.createdAt,
  updatedAt: album.updatedAt,
  accessCode: album.accessCode
});

const createAlbum = async (req, res) => {
  const album = await Album.create({
    title: req.body.title.trim(),
    description: req.body.description?.trim() || "",
    creator: req.user._id,
    contributors: [req.user._id],
    accessCode: req.user.accessCode
  });

  await album.populate("creator", "username profileImage");
  await album.populate("contributors", "username profileImage");

  return res.status(201).json({ album: formatAlbum(album) });
};

const getAlbums = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit, 8);
  const query = {
    accessCode: req.user.accessCode
  };

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } }
    ];
  }

  const [albums, total] = await Promise.all([
    Album.find(query)
      .populate("creator", "username profileImage")
      .populate("contributors", "username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Album.countDocuments(query)
  ]);

  return res.json({
    albums: albums.map(formatAlbum),
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + albums.length < total
    }
  });
};

const getAlbumById = async (req, res) => {
  const album = await Album.findById(req.params.albumId)
    .populate("creator", "username profileImage")
    .populate("contributors", "username profileImage");

  if (!album) {
    return res.status(404).json({ message: "Album not found." });
  }

  ensureAlbumAccess(album, req.user);

  const latestImages = await Image.find({ albumId: album._id })
    .sort({ createdAt: -1 })
    .limit(3)
    .select("url displaySize");

  return res.json({
    album: {
      ...formatAlbum(album),
      previewImages: latestImages
    }
  });
};

const deleteAlbum = async (req, res) => {
  const album = await Album.findById(req.params.albumId);

  if (!album) {
    return res.status(404).json({ message: "Album not found." });
  }

  ensureAlbumAccess(album, req.user);

  if (String(album.creator) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the album creator can delete this album." });
  }

  const images = await Image.find({ albumId: album._id });
  const imageIds = images.map((image) => image._id);

  await Promise.all(images.map((image) => deleteStoredFile(image.url)));

  await Promise.all([
    Comment.deleteMany({ imageId: { $in: imageIds } }),
    Reaction.deleteMany({ imageId: { $in: imageIds } }),
    Notification.deleteMany({
      $or: [{ album: album._id }, { image: { $in: imageIds } }]
    }),
    Image.deleteMany({ albumId: album._id }),
    album.deleteOne()
  ]);

  return res.json({ message: "Album deleted successfully." });
};

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum
};
