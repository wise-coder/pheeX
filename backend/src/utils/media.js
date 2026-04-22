const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Media = require("../models/Media");

const legacyUploadsDirectory = path.resolve(__dirname, "../uploads");

const sanitizeBaseName = (fileName = "image") =>
  path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";

const getExtension = (file) => {
  const extension = path.extname(file?.originalname || "");

  if (extension) {
    return extension.toLowerCase();
  }

  if (file?.mimetype === "image/png") {
    return ".png";
  }

  if (file?.mimetype === "image/webp") {
    return ".webp";
  }

  if (file?.mimetype === "image/gif") {
    return ".gif";
  }

  return ".jpg";
};

const buildFileName = (file) =>
  `${Date.now()}-${crypto.randomUUID()}-${sanitizeBaseName(file?.originalname)}${getExtension(file)}`;

const buildMediaUrl = (mediaId) => `/api/media/${mediaId}`;

const uploadToMongo = async (file, folder) => {
  const media = await Media.create({
    kind: folder,
    fileName: `${folder}-${buildFileName(file)}`,
    mimeType: file.mimetype || "image/jpeg",
    size: file.size || file.buffer.length,
    data: file.buffer
  });

  return {
    provider: "mongodb",
    path: String(media._id),
    url: buildMediaUrl(media._id)
  };
};

const saveUploadedFile = async (file, { folder = "images" } = {}) => {
  if (!file?.buffer) {
    const error = new Error("Uploaded file data was missing.");
    error.statusCode = 400;
    throw error;
  }

  return uploadToMongo(file, folder);
};

const deleteMongoUpload = async (url = "") => {
  const match = /^\/api\/media\/([a-f\d]{24})$/i.exec(url);

  if (!match) {
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(match[1])) {
    return;
  }

  await Media.deleteOne({ _id: match[1] });
};

const deleteLegacyLocalUpload = (url = "") => {
  if (!url.startsWith("/uploads/")) {
    return;
  }

  const fileName = path.basename(url);
  const filePath = path.resolve(legacyUploadsDirectory, fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteStoredFile = async (url = "") => {
  try {
    await deleteMongoUpload(url);
    deleteLegacyLocalUpload(url);
  } catch (error) {
    console.error(`Failed to remove stored file "${url}":`, error.message);
  }
};

module.exports = {
  saveUploadedFile,
  deleteStoredFile,
  buildMediaUrl
};
