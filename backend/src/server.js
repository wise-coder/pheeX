const fs = require("fs");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDatabase = require("./config/db");
const { validateStartupEnv } = require("./config/env");
const { initializeChatSocket } = require("./socket/chatSocket");

const PORT = process.env.PORT || 5000;
const uploadsPath = path.resolve(__dirname, "./uploads");

const startServer = async () => {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  const warnings = validateStartupEnv();
  warnings.forEach((warning) => {
    console.warn(`Startup warning: ${warning}`);
  });

  await connectDatabase();

  const server = http.createServer(app);
  initializeChatSocket(server);

  server.listen(PORT, () => {
    console.log(`pheeX server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
