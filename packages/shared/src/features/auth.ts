import { API_ENDPOINTS } from "../constants/endpoints";
import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RegisterRequest,
  TokenResponse,
  UserProfileUpdate,
  UserPublic,
} from "../contracts/auth";
import type { ApiEnvelope } from "../contracts/common";
import {
  sanitizeLoginPayload,
  sanitizePasswordResetConfirm,
  sanitizePasswordResetRequest,
  sanitizeRegisterPayload,
  sanitizeUserProfileUpdate,
} from "../validators/auth";
import type { FeatureApiContext } from "./context";

export const createAuthApi = ({ api, unwrap }: FeatureApiContext) => ({
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiEnvelope<AuthResponse>>(
      API_ENDPOINTS.auth.register,
      sanitizeRegisterPayload(payload),
    );
    return unwrap(response.data);
  },
  login: async (payload: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<ApiEnvelope<TokenResponse>>(
      API_ENDPOINTS.auth.login,
      sanitizeLoginPayload(payload),
    );
    return unwrap(response.data);
  },
  requestPasswordReset: async (payload: PasswordResetRequest): Promise<{ sent: boolean }> => {
    const response = await api.post<ApiEnvelope<{ sent: boolean }>>(
      API_ENDPOINTS.auth.requestPasswordReset,
      sanitizePasswordResetRequest(payload),
    );
    return unwrap(response.data);
  },
  confirmPasswordReset: async (
    payload: PasswordResetConfirmRequest,
  ): Promise<{ reset: boolean }> => {
    const response = await api.post<ApiEnvelope<{ reset: boolean }>>(
      API_ENDPOINTS.auth.resetPassword,
      sanitizePasswordResetConfirm(payload),
    );
    return unwrap(response.data);
  },
  refresh: async (payload: { refresh_token: string }): Promise<TokenResponse> => {
    const response = await api.post<ApiEnvelope<TokenResponse>>(
      API_ENDPOINTS.auth.refresh,
      payload,
    );
    return unwrap(response.data);
  },
  logout: async (payload: LogoutRequest): Promise<{ revoked: boolean }> => {
    const response = await api.post<ApiEnvelope<{ revoked: boolean }>>(
      API_ENDPOINTS.auth.logout,
      payload,
    );
    return unwrap(response.data);
  },
  getCurrentUser: async (): Promise<UserPublic> => {
    const response = await api.get<ApiEnvelope<UserPublic>>(API_ENDPOINTS.auth.me);
    return unwrap(response.data);
  },
  updateProfile: async (payload: UserProfileUpdate): Promise<UserPublic> => {
    const response = await api.patch<ApiEnvelope<UserPublic>>(
      API_ENDPOINTS.auth.me,
      sanitizeUserProfileUpdate(payload),
    );
    return unwrap(response.data);
  },
  listRoles: async (): Promise<{ roles: string[] }> => {
    const response = await api.get<ApiEnvelope<{ roles: string[] }>>(API_ENDPOINTS.auth.roles);
    return unwrap(response.data);
  },
});
