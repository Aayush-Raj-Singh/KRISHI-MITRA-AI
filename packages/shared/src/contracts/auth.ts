import type { Role } from "./common";

export interface UserPreferences {
  notifications?: boolean;
  voice_input?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  mfa_required?: boolean;
}

export interface UserPublic {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profile_image_url?: string | null;
  role: Role;
  location: string;
  farm_size: number;
  soil_type: string;
  water_source: string;
  primary_crops: string[];
  language: string;
  assigned_regions: string[];
  risk_view_consent: boolean;
  preferences?: UserPreferences | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AuthResponse {
  user: UserPublic;
  token: TokenResponse | null;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  location: string;
  farm_size: number;
  soil_type: string;
  water_source: string;
  primary_crops: string[];
  role: Role | "officer";
  language: string;
  assigned_regions?: string[];
  risk_view_consent?: boolean;
}

export interface LoginRequest {
  phone: string;
  password: string;
  mfa_code?: string | null;
}

export interface PasswordResetRequest {
  phone: string;
  channel: "sms" | "email";
}

export interface PasswordResetConfirmRequest {
  phone: string;
  otp: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface UserProfileUpdate {
  name?: string;
  email?: string | null;
  profile_image_url?: string | null;
  location?: string;
  farm_size?: number;
  soil_type?: string;
  water_source?: string;
  primary_crops?: string[];
  language?: string;
  risk_view_consent?: boolean;
  preferences?: UserPreferences;
}
