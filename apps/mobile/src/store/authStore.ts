import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { StateStorage, createJSONStorage, persist } from "zustand/middleware";

import type { TokenResponse, UserPublic } from "@krishimitra/shared";

interface AuthState {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserPublic | null;
  setHydrated: (value: boolean) => void;
  setTokens: (tokens: Pick<TokenResponse, "access_token" | "refresh_token">) => void;
  setUser: (user: UserPublic | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      setHydrated: (value) => set({ hydrated: value }),
      setTokens: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        }),
    }),
    {
      name: "krishimitra-mobile-auth",
      storage: createJSONStorage(
        (): StateStorage => ({
          getItem: async (name) => {
            const secureValue = await SecureStore.getItemAsync(name);
            if (secureValue) {
              return secureValue;
            }
            const legacyValue = await AsyncStorage.getItem(name);
            if (legacyValue) {
              await SecureStore.setItemAsync(name, legacyValue);
              await AsyncStorage.removeItem(name);
              return legacyValue;
            }
            return null;
          },
          setItem: async (name, value) => {
            await SecureStore.setItemAsync(name, value);
          },
          removeItem: async (name) => {
            await SecureStore.deleteItemAsync(name);
            await AsyncStorage.removeItem(name);
          },
        }),
      ),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
