import api, { ApiResponse, unwrap } from "./api";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserPublic {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profile_image_url?: string | null;
  role: string;
  location: string;
  farm_size: number;
  soil_type: string;
  water_source: string;
  primary_crops: string[];
  language: string;
  assigned_regions?: string[];
  risk_view_consent?: boolean;
  preferences?: {
    notifications?: boolean;
    voice_input?: boolean;
  };
  created_at: string;
  updated_at?: string | null;
}

export interface AuthResponse {
  user: UserPublic;
  token: TokenResponse | null;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  location: string;
  farm_size: number;
  soil_type: string;
  water_source: string;
  primary_crops: string[];
  role: string;
  language: string;
  assigned_regions?: string[];
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface PasswordResetRequestPayload {
  phone: string;
  channel: "sms" | "email";
}

export interface PasswordResetConfirmPayload {
  phone: string;
  otp: string;
  new_password: string;
}

export interface UserProfileUpdatePayload {
  name?: string;
  email?: string;
  profile_image_url?: string | null;
  location?: string;
  farm_size?: number;
  soil_type?: string;
  water_source?: string;
  primary_crops?: string[];
  language?: string;
  risk_view_consent?: boolean;
  preferences?: {
    notifications?: boolean;
    voice_input?: boolean;
  };
}

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", payload);
  return unwrap(response.data);
};

export const loginUser = async (payload: LoginPayload): Promise<TokenResponse> => {
  const response = await api.post<ApiResponse<TokenResponse>>("/auth/login", payload);
  return unwrap(response.data);
};

export const requestPasswordReset = async (payload: PasswordResetRequestPayload): Promise<{ sent: boolean }> => {
  const response = await api.post<ApiResponse<{ sent: boolean }>>("/auth/request-password-reset", payload);
  return unwrap(response.data);
};

export const confirmPasswordReset = async (
  payload: PasswordResetConfirmPayload
): Promise<{ reset: boolean }> => {
  const response = await api.post<ApiResponse<{ reset: boolean }>>("/auth/reset-password", payload);
  return unwrap(response.data);
};

export const refreshAuthToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await api.post<ApiResponse<TokenResponse>>("/auth/refresh", {
    refresh_token: refreshToken
  });
  return unwrap(response.data);
};

export const logoutAuthSession = async (refreshToken: string): Promise<{ revoked: boolean }> => {
  const response = await api.post<ApiResponse<{ revoked: boolean }>>("/auth/logout", {
    refresh_token: refreshToken
  });
  return unwrap(response.data);
};

export const updateProfile = async (payload: UserProfileUpdatePayload): Promise<UserPublic> => {
  const response = await api.patch<ApiResponse<UserPublic>>("/auth/me", payload);
  return unwrap(response.data);
};

export const fetchCurrentUser = async (): Promise<UserPublic> => {
  const response = await api.get<ApiResponse<UserPublic>>("/auth/me");
  return unwrap(response.data);
};
