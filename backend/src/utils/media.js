const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { getSupabaseClient, hasSupabaseStorageConfig } = require("../config/supabase");

const uploadsDirectory = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const getStorageBucket = () => process.env.SUPABASE_STORAGE_BUCKET;

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

const getSupabasePublicPrefix = () => {
  if (!process.env.SUPABASE_URL || !getStorageBucket()) {
    return "";
  }

  return `${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${getStorageBucket()}/`;
};

const getSupabaseObjectPath = (url = "") => {
  const prefix = getSupabasePublicPrefix();

  if (!prefix || !url.startsWith(prefix)) {
    return null;
  }

  return decodeURIComponent(url.slice(prefix.length).split("?")[0]);
};

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

const uploadToSupabaseStorage = async (file, folder) => {
  const supabase = getSupabaseClient();
  const objectPath = `${folder}/${buildFileName(file)}`;
  const bucket = getStorageBucket();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });

  if (uploadError) {
    const error = new Error("Failed to upload image to Supabase Storage.");
    error.statusCode = 500;
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    provider: "supabase",
    path: objectPath,
    url: data.publicUrl
  };
};

const saveUploadedFile = async (file, { folder = "images" } = {}) => {
  if (!file?.buffer) {
    const error = new Error("Uploaded file data was missing.");
    error.statusCode = 400;
    throw error;
  }

  if (hasSupabaseStorageConfig()) {
    return uploadToSupabaseStorage(file, folder);
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

const deleteSupabaseUpload = async (url = "") => {
  const supabase = getSupabaseClient();
  const objectPath = getSupabaseObjectPath(url);

  if (!supabase || !objectPath) {
    return false;
  }

  const { error } = await supabase.storage.from(getStorageBucket()).remove([objectPath]);

  if (error) {
    console.error(`Failed to delete Supabase asset "${objectPath}":`, error.message);
  }

  return true;
};

const deleteStoredFile = async (url = "") => {
  try {
    const deletedFromSupabase = await deleteSupabaseUpload(url);

    if (!deletedFromSupabase) {
      deleteLocalUpload(url);
    }
  } catch (error) {
    console.error(`Failed to remove stored file "${url}":`, error.message);
  }
};

module.exports = {
  saveUploadedFile,
  deleteStoredFile,
  deleteLocalUpload
};
