import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import errorHandler from "./middleware/errorHandler.js";
import createAdvisorRouter from "./routes/advisor.js";
import AICropAdvisorService from "./services/aiAdvisorService.js";

export const createApp = ({ advisorService } = {}) => {
  const app = express();
  const service = advisorService || new AICropAdvisorService();

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(express.json({ limit: "16kb" }));

  const advisorRateLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many advisor requests. Please try again later." });
    },
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/readyz", (_req, res) => {
    res.status(200).json({ ok: true, ready: true });
  });

  app.use("/api/ai", advisorRateLimiter, createAdvisorRouter({ advisorService: service }));

  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  app.use(errorHandler);

  return app;
};

export default createApp;
