const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const Message = require("../models/Message");
const User = require("../models/User");
const { touchUserPresence } = require("../utils/presence");
const {
  MAX_CHAT_MESSAGE_LENGTH,
  pruneChatHistory,
  serializeChatMessage
} = require("../utils/chat");

const ROOM_PREFIX = "access-code:";

const getTokenFromHandshake = (socket) => {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers?.authorization || "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice(7);
};

const getRoomName = (accessCode) => `${ROOM_PREFIX}${accessCode}`;

const initializeChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);

      if (!token) {
        return next(new Error("Authentication token is missing."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication failed."));
      }

      await touchUserPresence(user);
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket;

    if (!user?.accessCode) {
      socket.emit("chat:error", { message: "Join an access code to use group chat." });
      socket.disconnect();
      return;
    }

    socket.join(getRoomName(user.accessCode));

    socket.on("chat:send", async (payload = {}) => {
      try {
        const text = String(payload.text || "").trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);

        if (!text) {
          socket.emit("chat:error", { message: "Chat messages cannot be empty." });
          return;
        }

        const message = await Message.create({
          accessCode: user.accessCode,
          sender: user._id,
          text
        });

        await message.populate("sender", "username profileImage lastSeenAt");
        await pruneChatHistory(user.accessCode);

        io.to(getRoomName(user.accessCode)).emit("chat:message", serializeChatMessage(message));
      } catch (error) {
        socket.emit("chat:error", { message: "Unable to send chat message right now." });
      }
    });
  });

  return io;
};

module.exports = {
  initializeChatSocket
};
