const Notification = require("../models/Notification");

const createNotification = async ({
  recipientId,
  actorId,
  type,
  message,
  albumId = null,
  imageId = null
}) => {
  if (!recipientId || !actorId || String(recipientId) === String(actorId)) {
    return null;
  }

  return Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    message,
    album: albumId,
    image: imageId
  });
};

module.exports = createNotification;
