import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import LoginPage from "./pages/LoginPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAppSelector } from "./store/hooks";

const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const AdvisoryPage = React.lazy(() => import("./pages/AdvisoryPage"));
const AdminMasterDataPage = React.lazy(() => import("./pages/AdminMasterDataPage"));
const AuditLogsPage = React.lazy(() => import("./pages/AuditLogsPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const DataQualityPage = React.lazy(() => import("./pages/DataQualityPage"));
const DiseaseDetection = React.lazy(() => import("./pages/DiseaseDetection"));
const HelpdeskPage = React.lazy(() => import("./pages/HelpdeskPage"));
const MarketDirectoryPage = React.lazy(() => import("./pages/MarketDirectoryPage"));
const MarketIntelligencePage = React.lazy(() => import("./pages/MarketIntelligencePage"));
const NoticesPage = React.lazy(() => import("./pages/NoticesPage"));
const OfficerWorkflowPage = React.lazy(() => import("./pages/OfficerWorkflowPage"));
const OutcomeFeedbackPage = React.lazy(() => import("./pages/OutcomeFeedbackPage"));
const PortalPage = React.lazy(() => import("./pages/PortalPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const ModernFarmingPage = React.lazy(() => import("./pages/ModernFarmingPage"));
const ServicesPage = React.lazy(() => import("./pages/ServicesPage"));
const FarmOperationsPage = React.lazy(() => import("./pages/FarmOperationsPage"));

const LandingRoute: React.FC = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
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
        px: 3
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
          {`${t("actions.loading", { defaultValue: "Loading..." })} ${t("app.title")}`}
        </Typography>
      </Box>
    </Box>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/dashboard/price-arrival"
            element={<Navigate to="/services/market-intelligence?tab=arrivals" replace />}
          />
          <Route path="/analytics/trends" element={<Navigate to="/services/market-intelligence?tab=trends" replace />} />
          <Route path="/mandi-directory" element={<MarketDirectoryPage />} />
          <Route path="/helpdesk" element={<HelpdeskPage />} />
          <Route path="/alerts/market" element={<Navigate to="/services/market-intelligence?tab=alerts" replace />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/advisory" element={<AdvisoryPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/market-intelligence" element={<MarketIntelligencePage />} />
          <Route path="/services/farm-operations" element={<FarmOperationsPage />} />
          <Route path="/services/crop" element={<Navigate to="/services/farm-operations?tab=crop" replace />} />
          <Route path="/services/price" element={<Navigate to="/services/market-intelligence?tab=price" replace />} />
          <Route path="/services/water" element={<Navigate to="/services/farm-operations?tab=water" replace />} />
          <Route path="/services/feedback" element={<OutcomeFeedbackPage />} />
          <Route path="/services/modern-farming" element={<ModernFarmingPage />} />
          <Route path="/disease-detection" element={<DiseaseDetection />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["extension_officer", "admin"]} />}>
          <Route path="/officer/workflow" element={<OfficerWorkflowPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin/master-data" element={<AdminMasterDataPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/quality" element={<DataQualityPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
