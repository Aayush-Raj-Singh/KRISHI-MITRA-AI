import fs from "node:fs";
import path from "node:path";

const profile = (process.argv[2] || "").trim().toLowerCase();
const supportedProfiles = new Set(["bedrock"]);

if (!supportedProfiles.has(profile)) {
  console.error("Usage: node scripts/switch-backend-runtime-profile.mjs <bedrock>");
  process.exit(1);
}

const envPath = path.join(process.cwd(), "apps", "backend", ".env");
const original = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

const map = new Map();
for (const line of original.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) {
    map.set(match[1], match[2]);
  }
}

const setValue = (key, value) => {
  map.set(key, value);
};

const ensureValue = (key, value) => {
  if (!String(map.get(key) ?? "").trim()) {
    map.set(key, value);
  }
};

ensureValue("LLM_MAX_TOKENS", "800");
ensureValue("LLM_TEMPERATURE", "0.7");
setValue("RUNTIME_VALIDATION_MOCK_MODE", "false");
setValue("LLM_PROVIDER", "bedrock");
setValue("TRANSLATION_PROVIDER", "aws");
setValue("AWS_TRANSLATE_ENABLED", "true");
setValue("PUBLIC_TRANSLATE_FALLBACK_ENABLED", "false");
setValue("AWS_VALIDATION_MOCK_MODE", "false");

const orderedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
const output = `${orderedKeys.map((key) => `${key}=${map.get(key) ?? ""}`).join("\n")}\n`;
fs.writeFileSync(envPath, output, "utf8");

console.log(`Updated apps/backend/.env for profile: ${profile}`);
