import {
  createAuthApi,
  type AuthResponse,
  type LoginRequest as LoginPayload,
  type PasswordResetConfirmRequest as PasswordResetConfirmPayload,
  type PasswordResetRequest as PasswordResetRequestPayload,
  type RegisterRequest as RegisterPayload,
  type TokenResponse,
  type UserProfileUpdate as UserProfileUpdatePayload,
  type UserPublic
} from "@krishimitra/shared";

import api, { unwrap } from "./api";

const authApi = createAuthApi({ api, unwrap });

export type {
  AuthResponse,
  LoginPayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  RegisterPayload,
  TokenResponse,
  UserProfileUpdatePayload,
  UserPublic
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  return authApi.register(payload);
};

export const loginUser = async (payload: LoginPayload): Promise<TokenResponse> => {
  return authApi.login(payload);
};

export const requestPasswordReset = async (payload: PasswordResetRequestPayload): Promise<{ sent: boolean }> => {
  return authApi.requestPasswordReset(payload);
};

export const confirmPasswordReset = async (
  payload: PasswordResetConfirmPayload
): Promise<{ reset: boolean }> => {
  return authApi.confirmPasswordReset(payload);
};

export const refreshAuthToken = async (refreshToken: string): Promise<TokenResponse> => {
  return authApi.refresh({ refresh_token: refreshToken });
};

export const logoutAuthSession = async (refreshToken: string): Promise<{ revoked: boolean }> => {
  return authApi.logout({ refresh_token: refreshToken });
};

export const updateProfile = async (payload: UserProfileUpdatePayload): Promise<UserPublic> => {
  return authApi.updateProfile(payload);
};

export const fetchCurrentUser = async (): Promise<UserPublic> => {
  return authApi.getCurrentUser();
};
