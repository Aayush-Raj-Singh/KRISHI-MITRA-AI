import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginForm from "./LoginForm";
import authReducer from "../../store/authSlice";
import { getAccessToken } from "../../services/authStorage";

const { fetchCurrentUserMock, loginUserMock } = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
  loginUserMock: vi.fn(),
}));

vi.mock("../../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../../services/auth")>("../../services/auth");
  return {
    ...actual,
    fetchCurrentUser: fetchCurrentUserMock,
    loginUser: loginUserMock,
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

const renderLoginForm = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <LoginForm />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

  return { store };
};

describe("LoginForm", () => {
  beforeEach(() => {
    loginUserMock.mockReset();
    fetchCurrentUserMock.mockReset();
  });

  it("stores tokens before loading the current user", async () => {
    loginUserMock.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "bearer",
      expires_in: 900,
      mfa_required: false,
    });
    fetchCurrentUserMock.mockImplementation(async () => {
      expect(getAccessToken()).toBe("access-token");
      return {
        id: "user-1",
        name: "Sudhir Kumar Singh",
        phone: "9876543210",
        role: "farmer",
        location: "Patna",
        farm_size: 2,
        soil_type: "loamy",
        water_source: "canal",
        primary_crops: ["rice"],
        language: "en",
        assigned_regions: [],
        risk_view_consent: false,
        created_at: new Date().toISOString(),
      };
    });

    const { store } = renderLoginForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/auth\.phone/i), "9876543210");
    await user.type(screen.getByLabelText(/auth\.password/i), "Password@123");
    await user.click(screen.getByRole("button", { name: "auth.sign_in" }));

    await waitFor(() => {
      expect(loginUserMock).toHaveBeenCalledWith({
        phone: "9876543210",
        password: "Password@123",
      });
    });
    await waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().auth.accessToken).toBe("access-token");
    expect(store.getState().auth.user?.name).toBe("Sudhir Kumar Singh");
  });
});
