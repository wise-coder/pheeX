const Message = require("../models/Message");
const { serializePublicUser } = require("./presence");

const MAX_CHAT_HISTORY_PER_ACCESS_CODE = 200;
const DEFAULT_CHAT_HISTORY_LIMIT = 60;
const MAX_CHAT_HISTORY_LIMIT = 80;
const MAX_CHAT_MESSAGE_LENGTH = 280;

const serializeChatMessage = (message) => ({
  _id: message._id,
  accessCode: message.accessCode,
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  sender: serializePublicUser(message.sender)
});

const pruneChatHistory = async (accessCode) => {
  const overflowMessages = await Message.find({ accessCode })
    .sort({ createdAt: -1 })
    .skip(MAX_CHAT_HISTORY_PER_ACCESS_CODE)
    .select("_id")
    .lean();

  if (!overflowMessages.length) {
    return;
  }

  await Message.deleteMany({
    _id: { $in: overflowMessages.map((message) => message._id) }
  });
};

module.exports = {
  MAX_CHAT_HISTORY_PER_ACCESS_CODE,
  DEFAULT_CHAT_HISTORY_LIMIT,
  MAX_CHAT_HISTORY_LIMIT,
  MAX_CHAT_MESSAGE_LENGTH,
  serializeChatMessage,
  pruneChatHistory
};
