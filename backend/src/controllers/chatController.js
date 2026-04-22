const Message = require("../models/Message");
const {
  DEFAULT_CHAT_HISTORY_LIMIT,
  MAX_CHAT_HISTORY_LIMIT,
  serializeChatMessage
} = require("../utils/chat");

const getMessages = async (req, res) => {
  const requestedLimit = Number(req.query.limit || DEFAULT_CHAT_HISTORY_LIMIT);
  const limit = Math.max(1, Math.min(MAX_CHAT_HISTORY_LIMIT, requestedLimit));

  const messages = await Message.find({ accessCode: req.user.accessCode })
    .populate("sender", "username profileImage lastSeenAt")
    .sort({ createdAt: -1 })
    .limit(limit);

  return res.json({
    messages: messages.reverse().map(serializeChatMessage)
  });
};

module.exports = {
  getMessages
};
