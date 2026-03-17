import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";

import { fetchCurrentUser } from "../../services/auth";
import { logout, setUser } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

interface ProtectedRouteProps {
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.user?.role);
  const shouldBootstrap = Boolean(accessToken && !user);
  const [bootstrapping, setBootstrapping] = useState(shouldBootstrap);

  useEffect(() => {
    let cancelled = false;
    if (!shouldBootstrap) {
      setBootstrapping(false);
      return undefined;
    }

    setBootstrapping(true);
    void fetchCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;
        dispatch(setUser(currentUser));
      })
      .catch(() => {
        if (cancelled) return;
        dispatch(logout());
      })
      .finally(() => {
        if (cancelled) return;
        setBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, shouldBootstrap]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (shouldBootstrap || (bootstrapping && !user)) {
    return (
      <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
