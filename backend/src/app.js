const express = require("express");
const path = require("path");
require("express-async-errors");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const albumRoutes = require("./routes/albumRoutes");
const imageRoutes = require("./routes/imageRoutes");
const commentRoutes = require("./routes/commentRoutes");
const reactionRoutes = require("./routes/reactionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const frontendPath = path.resolve(__dirname, "../../frontend");
const uploadsPath = path.resolve(__dirname, "./uploads");

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ message: "pheeX API is healthy." });
});

app.use("/uploads", express.static(uploadsPath));
app.use("/api/media", mediaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.use(express.static(frontendPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  return res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
