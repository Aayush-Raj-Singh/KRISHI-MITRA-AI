import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { TokenResponse, UserPublic } from "../services/auth";
import {
  clearAuthTokens,
  clearStoredUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthTokens,
  setStoredUser
} from "../services/authStorage";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserPublic | null;
}

const initialState: AuthState = {
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  user: getStoredUser<UserPublic>()
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<TokenResponse>) {
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      setAuthTokens(action.payload.access_token, action.payload.refresh_token);
    },
    setUser(state, action: PayloadAction<UserPublic>) {
      state.user = action.payload;
      setStoredUser(action.payload);
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      clearAuthTokens();
      clearStoredUser();
    }
  }
});

export const { setTokens, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
