import { saveOfflineSessionSnapshot } from "../utils/offlineStorage";

const ACCESS_TOKEN_KEY = "krishimitra:auth:access_token";
const REFRESH_TOKEN_KEY = "krishimitra:auth:refresh_token";
const USER_KEY = "krishimitra:auth:user";

const LEGACY_ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_USER_KEY = "user";

let inMemoryAccessToken: string | null = null;
let hasMigratedLegacyStorage = false;

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

const readValue = (storage: Storage | null, key: string): string | null => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeValue = (storage: Storage | null, key: string, value: string): void => {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {}
};

const removeValue = (storage: Storage | null, key: string): void => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {}
};

const migrateLegacyStorage = (): void => {
  if (hasMigratedLegacyStorage) return;
  hasMigratedLegacyStorage = true;

  const session = getSessionStorage();
  const local = getLocalStorage();
  if (!session || !local) return;

  const legacyAccess = readValue(local, LEGACY_ACCESS_TOKEN_KEY);
  const legacyRefresh = readValue(local, LEGACY_REFRESH_TOKEN_KEY);
  const legacyUser = readValue(local, LEGACY_USER_KEY);

  if (!readValue(session, ACCESS_TOKEN_KEY) && legacyAccess) {
    writeValue(session, ACCESS_TOKEN_KEY, legacyAccess);
  }
  if (!readValue(session, REFRESH_TOKEN_KEY) && legacyRefresh) {
    writeValue(session, REFRESH_TOKEN_KEY, legacyRefresh);
  }
  if (!readValue(session, USER_KEY) && legacyUser) {
    writeValue(session, USER_KEY, legacyUser);
  }

  removeValue(local, LEGACY_ACCESS_TOKEN_KEY);
  removeValue(local, LEGACY_REFRESH_TOKEN_KEY);
  removeValue(local, LEGACY_USER_KEY);
};

export const getAccessToken = (): string | null => {
  migrateLegacyStorage();
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const token = readValue(getSessionStorage(), ACCESS_TOKEN_KEY);
  inMemoryAccessToken = token;
  return token;
};

export const getRefreshToken = (): string | null => {
  migrateLegacyStorage();
  return readValue(getSessionStorage(), REFRESH_TOKEN_KEY);
};

export const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  migrateLegacyStorage();
  inMemoryAccessToken = accessToken;
  const session = getSessionStorage();
  writeValue(session, ACCESS_TOKEN_KEY, accessToken);
  writeValue(session, REFRESH_TOKEN_KEY, refreshToken);
};

export const setAccessToken = (accessToken: string): void => {
  migrateLegacyStorage();
  inMemoryAccessToken = accessToken;
  writeValue(getSessionStorage(), ACCESS_TOKEN_KEY, accessToken);
};

export const clearAuthTokens = (): void => {
  migrateLegacyStorage();
  inMemoryAccessToken = null;
  const session = getSessionStorage();
  removeValue(session, ACCESS_TOKEN_KEY);
  removeValue(session, REFRESH_TOKEN_KEY);
};

export const getStoredUser = <T>(): T | null => {
  migrateLegacyStorage();
  const raw = readValue(getSessionStorage(), USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setStoredUser = (value: unknown): void => {
  migrateLegacyStorage();
  writeValue(getSessionStorage(), USER_KEY, JSON.stringify(value));
  saveOfflineSessionSnapshot({ user: value });
};

export const clearStoredUser = (): void => {
  migrateLegacyStorage();
  removeValue(getSessionStorage(), USER_KEY);
  saveOfflineSessionSnapshot({ user: null });
};
