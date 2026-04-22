const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const sharp = require("sharp");

const Media = require("../models/Media");

const legacyUploadsDirectory = path.resolve(__dirname, "../uploads");
const MEDIA_TRANSFORMS = {
  profiles: {
    width: 512,
    height: 512,
    fit: "cover",
    quality: 78
  },
  images: {
    width: 1600,
    height: 1600,
    fit: "inside",
    quality: 80
  }
};
const BYPASS_OPTIMIZATION_MIME_TYPES = new Set(["image/gif", "image/svg+xml"]);

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

const buildFileName = (file, extension = getExtension(file)) =>
  `${Date.now()}-${crypto.randomUUID()}-${sanitizeBaseName(file?.originalname)}${extension}`;

const buildMediaUrl = (mediaId) => `/api/media/${mediaId}`;

const optimizeUploadedImage = async (file, folder) => {
  if (!file?.buffer || BYPASS_OPTIMIZATION_MIME_TYPES.has(file.mimetype)) {
    return {
      ...file,
      size: file?.size || file?.buffer?.length || 0
    };
  }

  const transform = MEDIA_TRANSFORMS[folder] || MEDIA_TRANSFORMS.images;

  try {
    let pipeline = sharp(file.buffer, { failOn: "none" }).rotate().resize({
      width: transform.width,
      height: transform.height,
      fit: transform.fit,
      withoutEnlargement: true
    });

    if (folder === "profiles") {
      pipeline = pipeline.flatten({ background: "#111114" });
    }

    const buffer = await pipeline.webp({
      quality: transform.quality,
      effort: 4
    }).toBuffer();

    return {
      ...file,
      buffer,
      mimetype: "image/webp",
      size: buffer.length
    };
  } catch (error) {
    console.warn(`Image optimization skipped for "${file.originalname}": ${error.message}`);
    return {
      ...file,
      size: file.size || file.buffer.length
    };
  }
};

const uploadToMongo = async (file, folder) => {
  const processedFile = await optimizeUploadedImage(file, folder);

  const media = await Media.create({
    kind: folder,
    fileName: `${folder}-${buildFileName(
      processedFile,
      processedFile.mimetype === "image/webp" ? ".webp" : getExtension(processedFile)
    )}`,
    mimeType: processedFile.mimetype || "image/jpeg",
    size: processedFile.size || processedFile.buffer.length,
    data: processedFile.buffer
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
