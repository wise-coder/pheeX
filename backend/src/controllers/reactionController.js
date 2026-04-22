const Image = require("../models/Image");
const Reaction = require("../models/Reaction");
const createNotification = require("../utils/notification");
const Album = require("../models/Album");
const { ensureAlbumAccess } = require("../utils/access");

const getSummary = async (imageId, viewerId) => {
  const reactions = await Reaction.find({ imageId }).lean();
  const summary = reactions.reduce(
    (accumulator, reaction) => {
      accumulator[reaction.type] = (accumulator[reaction.type] || 0) + 1;
      return accumulator;
    },
    { like: 0, love: 0, fire: 0 }
  );
  const viewerReaction =
    reactions.find((reaction) => String(reaction.userId) === String(viewerId))?.type || null;

  return {
    reactionSummary: summary,
    viewerReaction,
    likes: reactions.length
  };
};

const toggleReaction = async (req, res) => {
  const { imageId, type } = req.body;
  const image = await Image.findById(imageId).populate("uploadedBy", "username profileImage");

  if (!image) {
    return res.status(404).json({ message: "Image not found." });
  }

  const album = await Album.findById(image.albumId);
  ensureAlbumAccess(album, req.user);

  const existingReaction = await Reaction.findOne({
    userId: req.user._id,
    imageId
  });

  let action = "added";

  if (existingReaction && existingReaction.type === type) {
    await existingReaction.deleteOne();
    image.likes = Math.max(image.likes - 1, 0);
    action = "removed";
  } else if (existingReaction) {
    existingReaction.type = type;
    await existingReaction.save();
    action = "updated";
  } else {
    await Reaction.create({
      userId: req.user._id,
      imageId,
      type
    });
    image.likes += 1;
  }

  await image.save();

  if (action !== "removed") {
    await createNotification({
      recipientId: image.uploadedBy._id,
      actorId: req.user._id,
      type: "reaction",
      message: `${req.user.username} reacted to your image.`,
      albumId: image.albumId,
      imageId: image._id
    });
  }

  return res.json({
    action,
    ...(await getSummary(imageId, req.user._id))
  });
};

module.exports = {
  toggleReaction
};
