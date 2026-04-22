const Album = require("../models/Album");
const Image = require("../models/Image");

const ensureAlbumAccess = (album, user) => {
  if (!album) {
    const error = new Error("Album not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!user?.accessCode || album.accessCode !== user.accessCode) {
    const error = new Error("You do not have access to this album.");
    error.statusCode = 403;
    throw error;
  }
};

const ensureAlbumOwnership = (album, user) => {
  ensureAlbumAccess(album, user);

  if (String(album.creator) !== String(user._id)) {
    const error = new Error("Only the album creator can do that.");
    error.statusCode = 403;
    throw error;
  }
};

const getAccessibleAlbum = async (albumId, user) => {
  const album = await Album.findById(albumId);
  ensureAlbumAccess(album, user);
  return album;
};

const getOwnedAlbum = async (albumId, user) => {
  const album = await Album.findById(albumId);
  ensureAlbumOwnership(album, user);
  return album;
};

const getAccessibleImage = async (imageId, user) => {
  const image = await Image.findById(imageId);

  if (!image) {
    const error = new Error("Image not found.");
    error.statusCode = 404;
    throw error;
  }

  const album = await Album.findById(image.albumId);
  ensureAlbumAccess(album, user);

  return { image, album };
};

const getOwnedImage = async (imageId, user) => {
  const image = await Image.findById(imageId);

  if (!image) {
    const error = new Error("Image not found.");
    error.statusCode = 404;
    throw error;
  }

  const album = await Album.findById(image.albumId);
  ensureAlbumOwnership(album, user);

  return { image, album };
};

module.exports = {
  ensureAlbumAccess,
  ensureAlbumOwnership,
  getAccessibleAlbum,
  getOwnedAlbum,
  getAccessibleImage,
  getOwnedImage
};
