import env from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();
const server = app.listen(env.port, () => {
  process.stdout.write(`AI Crop Advisor service listening on port ${env.port}\n`);
});

const shutdown = (signal) => {
  process.stdout.write(`Received ${signal}. Shutting down AI Crop Advisor service.\n`);
  server.close((error) => {
    if (error) {
      process.stderr.write(`Shutdown error: ${error.message}\n`);
      process.exit(1);
      return;
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
