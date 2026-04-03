import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";
import authReducer from "../../store/authSlice";
import type { UserPublic } from "../../services/auth";

const { fetchCurrentUserMock } = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
}));

vi.mock("../../services/auth", async () => {
  return {
    fetchCurrentUser: fetchCurrentUserMock,
  };
});

const renderProtectedRoute = (authState: {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserPublic | null;
}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });

  const utils = render(
    <Provider store={store}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={["/dashboard"]}
      >
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...utils };
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockReset();
  });

  it("redirects to login when there is no access token", async () => {
    const { findByText } = renderProtectedRoute({
      accessToken: null,
      refreshToken: null,
      user: null,
    });

    expect(await findByText("Login Screen")).toBeInTheDocument();
    expect(fetchCurrentUserMock).not.toHaveBeenCalled();
  });

  it("bootstraps the current user when only a token exists", async () => {
    fetchCurrentUserMock.mockResolvedValue({
      id: "user-1",
      name: "Officer One",
      phone: "9876543210",
      role: "extension_officer",
      location: "Patna",
      farm_size: 2,
      soil_type: "loamy",
      water_source: "canal",
      primary_crops: ["rice"],
      language: "en",
      assigned_regions: [],
      risk_view_consent: false,
      created_at: new Date().toISOString(),
    });

    const { findByText, store } = renderProtectedRoute({
      accessToken: "token",
      refreshToken: "refresh",
      user: null,
    });

    expect(await findByText("Dashboard Screen")).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().auth.user?.name).toBe("Officer One");
  });

  it("logs out and redirects when bootstrap fails", async () => {
    fetchCurrentUserMock.mockRejectedValue(new Error("unauthorized"));

    const { findByText, store } = renderProtectedRoute({
      accessToken: "token",
      refreshToken: "refresh",
      user: null,
    });

    expect(await findByText("Login Screen")).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
