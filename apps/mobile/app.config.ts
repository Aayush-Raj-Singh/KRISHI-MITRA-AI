import fs from "fs";
import path from "path";

const parseEnvFile = (filePath: string): Record<string, string> => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex < 0) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key) {
        acc[key] = value;
      }
      return acc;
    }, {});
};

const normalizeApiBaseUrl = (value?: string) => {
  const normalized = (value || "http://10.0.2.2:8000").trim().replace(/\/+$/, "");
  return /\/api\/v1$/i.test(normalized) ? normalized : `${normalized}/api/v1`;
};

const env = parseEnvFile(path.join(__dirname, ".env"));
const apiBaseUrl = normalizeApiBaseUrl(env.API_BASE_URL || process.env.API_BASE_URL);

export default () => ({
  expo: {
    name: "KrishiMitra AI",
    slug: "krishimitra-ai-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "krishimitraai",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#f5efe3",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#f5efe3",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      package: "ai.krishimitra.mobile",
    },
    extra: {
      apiBaseUrl,
    },
  },
});
