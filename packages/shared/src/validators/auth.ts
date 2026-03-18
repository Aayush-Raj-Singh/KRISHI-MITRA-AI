import type {
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RegisterRequest,
  UserProfileUpdate
} from "../contracts/auth";
import { compactStringArray, ensureMinValue, requireText, toFiniteNumber } from "./shared";

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!PHONE_REGEX.test(digits)) {
    throw new Error("Phone number must be 10 digits");
  }
  return digits;
};

export const normalizeEmail = (value?: string | null): string | null => {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (!EMAIL_REGEX.test(normalized) || normalized.includes("..")) {
    throw new Error("Invalid email address");
  }
  return normalized;
};

export const ensureStrongPassword = (value: string): string => {
  const password = value || "";
  const rules = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
  if (password.length < 8 || rules.some((rule) => !rule.test(password))) {
    throw new Error("Password must be 8+ characters and include upper, lower, number, and special characters");
  }
  return password;
};

export const sanitizeRegisterPayload = (payload: RegisterRequest): RegisterRequest => ({
  ...payload,
  name: requireText(payload.name, "Name"),
  phone: normalizePhone(payload.phone),
  email: normalizeEmail(payload.email),
  password: ensureStrongPassword(payload.password),
  location: requireText(payload.location, "Location"),
  farm_size: ensureMinValue(toFiniteNumber(payload.farm_size, "Farm size"), 0.01, "Farm size"),
  soil_type: requireText(payload.soil_type, "Soil type"),
  water_source: requireText(payload.water_source, "Water source"),
  primary_crops: compactStringArray(payload.primary_crops),
  role: (payload.role || "farmer").toLowerCase() as RegisterRequest["role"],
  language: requireText(payload.language || "en", "Language"),
  assigned_regions: compactStringArray(payload.assigned_regions || []),
  risk_view_consent: Boolean(payload.risk_view_consent)
});

export const sanitizeLoginPayload = (payload: LoginRequest): LoginRequest => ({
  phone: normalizePhone(payload.phone),
  password: ensureStrongPassword(payload.password),
  mfa_code: payload.mfa_code ? payload.mfa_code.trim() : undefined
});

export const sanitizePasswordResetRequest = (payload: PasswordResetRequest): PasswordResetRequest => ({
  phone: normalizePhone(payload.phone),
  channel: payload.channel === "email" ? "email" : "sms"
});

export const sanitizePasswordResetConfirm = (
  payload: PasswordResetConfirmRequest
): PasswordResetConfirmRequest => ({
  phone: normalizePhone(payload.phone),
  otp: requireText(payload.otp, "OTP"),
  new_password: ensureStrongPassword(payload.new_password)
});

export const sanitizeUserProfileUpdate = (payload: UserProfileUpdate): UserProfileUpdate => ({
  ...payload,
  name: payload.name ? requireText(payload.name, "Name") : undefined,
  email: payload.email === undefined ? undefined : normalizeEmail(payload.email),
  location: payload.location ? requireText(payload.location, "Location") : undefined,
  farm_size:
    payload.farm_size === undefined
      ? undefined
      : ensureMinValue(toFiniteNumber(payload.farm_size, "Farm size"), 0.01, "Farm size"),
  soil_type: payload.soil_type ? requireText(payload.soil_type, "Soil type") : undefined,
  water_source: payload.water_source ? requireText(payload.water_source, "Water source") : undefined,
  primary_crops: payload.primary_crops ? compactStringArray(payload.primary_crops) : undefined,
  language: payload.language ? requireText(payload.language, "Language") : undefined
});
