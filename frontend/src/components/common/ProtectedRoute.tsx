import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAppSelector } from "../../store/hooks";

const ProtectedRoute: React.FC = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
