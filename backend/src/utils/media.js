const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const uploadsDirectory = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

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

const uploadToLocalDisk = async (file, folder) => {
  const fileName = `${folder}-${buildFileName(file)}`;
  const filePath = path.resolve(uploadsDirectory, fileName);

  await fs.promises.writeFile(filePath, file.buffer);

  return {
    provider: "local",
    path: fileName,
    url: `/uploads/${fileName}`
  };
};

const saveUploadedFile = async (file, { folder = "images" } = {}) => {
  if (!file?.buffer) {
    const error = new Error("Uploaded file data was missing.");
    error.statusCode = 400;
    throw error;
  }

  return uploadToLocalDisk(file, folder);
};

const deleteLocalUpload = (url = "") => {
  if (!url.startsWith("/uploads/")) {
    return;
  }

  const fileName = path.basename(url);
  const filePath = path.resolve(__dirname, "../uploads", fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteStoredFile = async (url = "") => {
  try {
    deleteLocalUpload(url);
  } catch (error) {
    console.error(`Failed to remove stored file "${url}":`, error.message);
  }
};

module.exports = {
  saveUploadedFile,
  deleteStoredFile,
  deleteLocalUpload
};
