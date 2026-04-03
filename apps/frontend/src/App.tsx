import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import LoginPage from "./pages/LoginPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAppSelector } from "./store/hooks";
import {
  AdminMasterDataPageLazy,
  AdvisoryPageLazy,
  AuditLogsPageLazy,
  DashboardPageLazy,
  DataQualityPageLazy,
  DiseaseDetectionPageLazy,
  FarmOperationsPageLazy,
  HelpdeskPageLazy,
  LandingPageLazy,
  MarketDirectoryPageLazy,
  MarketIntelligencePageLazy,
  ModernFarmingPageLazy,
  NationalAgricultureIntelligencePageLazy,
  NoticesPageLazy,
  OfficerWorkflowPageLazy,
  OutcomeFeedbackPageLazy,
  PortalPageLazy,
  primeRouteModules,
  ProfilePageLazy,
  ServicesPageLazy,
} from "./routes/routeModules";

const LandingRoute: React.FC = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPageLazy />;
};

const RouteLoadingFallback: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #f4f1e8 0%, #eef4ed 100%)",
        px: 3,
      }}
    >
      <Box className="app-shell-enter" sx={{ textAlign: "center" }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
          {`${t("actions.loading", { defaultValue: "Loading..." })} ${t("app.title")}`}
        </Typography>
      </Box>
    </Box>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    primeRouteModules();
  }, []);

  return (
    <Suspense key={location.pathname} fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPageLazy />} />
          <Route
            path="/dashboard/price-arrival"
            element={<Navigate to="/services/market-intelligence?tab=arrivals" replace />}
          />
          <Route
            path="/analytics/trends"
            element={<Navigate to="/services/market-intelligence?tab=trends" replace />}
          />
          <Route path="/mandi-directory" element={<MarketDirectoryPageLazy />} />
          <Route path="/helpdesk" element={<HelpdeskPageLazy />} />
          <Route
            path="/alerts/market"
            element={<Navigate to="/services/market-intelligence?tab=alerts" replace />}
          />
          <Route path="/portal" element={<PortalPageLazy />} />
          <Route path="/advisory" element={<AdvisoryPageLazy />} />
          <Route path="/notices" element={<NoticesPageLazy />} />
          <Route path="/services" element={<ServicesPageLazy />} />
          <Route
            path="/services/national-intelligence"
            element={<NationalAgricultureIntelligencePageLazy />}
          />
          <Route
            path="/services/market-intelligence"
            element={<MarketIntelligencePageLazy />}
          />
          <Route path="/services/farm-operations" element={<FarmOperationsPageLazy />} />
          <Route
            path="/services/crop"
            element={<Navigate to="/services/farm-operations?tab=crop" replace />}
          />
          <Route
            path="/services/price"
            element={<Navigate to="/services/market-intelligence?tab=price" replace />}
          />
          <Route
            path="/services/water"
            element={<Navigate to="/services/farm-operations?tab=water" replace />}
          />
          <Route path="/services/feedback" element={<OutcomeFeedbackPageLazy />} />
          <Route path="/services/modern-farming" element={<ModernFarmingPageLazy />} />
          <Route path="/disease-detection" element={<DiseaseDetectionPageLazy />} />
          <Route path="/profile" element={<ProfilePageLazy />} />
        </Route>
        <Route element={<ProtectedRoute roles={["extension_officer", "admin"]} />}>
          <Route path="/officer/workflow" element={<OfficerWorkflowPageLazy />} />
        </Route>
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin/master-data" element={<AdminMasterDataPageLazy />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPageLazy />} />
          <Route path="/admin/quality" element={<DataQualityPageLazy />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
