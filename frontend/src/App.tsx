import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdvisoryPage from "./pages/AdvisoryPage";
import CropRecommendationPage from "./pages/CropRecommendationPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NoticesPage from "./pages/NoticesPage";
import OutcomeFeedbackPage from "./pages/OutcomeFeedbackPage";
import PriceForecastPage from "./pages/PriceForecastPage";
import ProfilePage from "./pages/ProfilePage";
import ModernFarmingPage from "./pages/ModernFarmingPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ServicesPage from "./pages/ServicesPage";
import WaterOptimizationPage from "./pages/WaterOptimizationPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/advisory" element={<AdvisoryPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/crop" element={<CropRecommendationPage />} />
        <Route path="/services/price" element={<PriceForecastPage />} />
        <Route path="/services/water" element={<WaterOptimizationPage />} />
        <Route path="/services/feedback" element={<OutcomeFeedbackPage />} />
        <Route path="/services/modern-farming" element={<ModernFarmingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
