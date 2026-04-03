import "dotenv/config";

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  port: toPositiveInt(process.env.PORT, 4100),
  isProduction:
    String(process.env.NODE_ENV || "")
      .trim()
      .toLowerCase() === "production",
  awsRegion: (process.env.AWS_REGION || "ap-south-1").trim(),
  awsProfile: (process.env.AWS_PROFILE || "").trim() || undefined,
  bedrockModelId: (process.env.BEDROCK_MODEL_ID || "openai.gpt-oss-20b-1:0").trim(),
  bedrockFallbackModelId: (
    process.env.BEDROCK_FALLBACK_MODEL_ID ||
    process.env.BEDROCK_TITAN_MODEL_ID ||
    "openai.gpt-oss-120b-1:0"
  ).trim(),
  defaultLanguage: (process.env.ADVISOR_DEFAULT_LANGUAGE || "en").trim().toLowerCase(),
  rateLimitWindowMs: toPositiveInt(process.env.ADVISOR_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toPositiveInt(process.env.ADVISOR_RATE_LIMIT_MAX, 30),
};

export default env;
