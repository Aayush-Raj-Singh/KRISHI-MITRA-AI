import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";
import authReducer from "../../store/authSlice";

const { fetchCurrentUserMock } = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn()
}));

vi.mock("../../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../../services/auth")>("../../services/auth");
  return {
    ...actual,
    fetchCurrentUser: fetchCurrentUserMock
  };
});

const renderProtectedRoute = (authState: {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    location: string;
    farm_size: number;
    soil_type: string;
    water_source: string;
    primary_crops: string[];
    language: string;
    created_at: string;
  } | null;
}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState }
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  return store;
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockReset();
  });

  it("redirects to login when there is no access token", async () => {
    renderProtectedRoute({
      accessToken: null,
      refreshToken: null,
      user: null
    });

    expect(await screen.findByText("Login Screen")).toBeInTheDocument();
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
      created_at: new Date().toISOString()
    });

    const store = renderProtectedRoute({
      accessToken: "token",
      refreshToken: "refresh",
      user: null
    });

    expect(await screen.findByText("Dashboard Screen")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().auth.user?.name).toBe("Officer One");
  });

  it("logs out and redirects when bootstrap fails", async () => {
    fetchCurrentUserMock.mockRejectedValue(new Error("unauthorized"));

    const store = renderProtectedRoute({
      accessToken: "token",
      refreshToken: "refresh",
      user: null
    });

    expect(await screen.findByText("Login Screen")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
