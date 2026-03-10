import React from "react";
import {
  Alert,
  Stack
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { useAppSelector } from "../store/hooks";
import OnboardingDialog from "../components/onboarding/OnboardingDialog";
import {
  AGRI_SLIDES,
  SLIDER_AUTOPLAY_MS,
  spacingScale
} from "./dashboard/constants";
import useDashboardCarousel from "./dashboard/hooks/useDashboardCarousel";
import useDashboardData from "./dashboard/hooks/useDashboardData";
import useDashboardHashScroll from "./dashboard/hooks/useDashboardHashScroll";
import useDashboardOnboarding from "./dashboard/hooks/useDashboardOnboarding";
import useDashboardRealtime from "./dashboard/hooks/useDashboardRealtime";
import HeroCarouselSection from "./dashboard/sections/HeroCarouselSection";
import HeroOverviewSection from "./dashboard/sections/HeroOverviewSection";
import ImportantLinksSection from "./dashboard/sections/ImportantLinksSection";
import MarketDataSection from "./dashboard/sections/MarketDataSection";
import NoticesGallerySection from "./dashboard/sections/NoticesGallerySection";
import OfficerAnalyticsSection from "./dashboard/sections/OfficerAnalyticsSection";
import RealtimeUpdatesSection from "./dashboard/sections/RealtimeUpdatesSection";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement);

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDashboardHashScroll();

  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isOfficer = user?.role === "extension_officer" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const visibleSlideCount = 1;

  const { onboardingLabels, onboardingOpen, setOnboardingOpen, handleOnboardingComplete } = useDashboardOnboarding();
  const { wsStatus, wsUrl, realtimeEvents } = useDashboardRealtime(accessToken);
  const { carouselRef, handleCarouselScroll, showPrevSlide, showNextSlide } = useDashboardCarousel({
    slideCount: AGRI_SLIDES.length,
    visibleSlideCount,
    autoplayMs: SLIDER_AUTOPLAY_MS
  });

  const {
    analyticsFilters,
    setAnalyticsFilters,
    analyticsData,
    farmersNeedingAttention,
    feedbackReliability,
    operationsOverview,
    weatherLocation,
    setWeatherLocation,
    weatherDays,
    setWeatherDays,
    weatherResult,
    weatherView,
    setWeatherView,
    mandiForm,
    setMandiForm,
    mandiCategory,
    setMandiCategory,
    mandiCatalogData,
    mandiResult,
    showMandiTable,
    setShowMandiTable,
    analyticsMutation,
    attentionMutation,
    feedbackReliabilityMutation,
    operationsOverviewMutation,
    triggerWeeklyMutation,
    triggerQuarterlyMutation,
    triggerDailyDataMutation,
    weatherMutation,
    mandiMutation,
    analyticsChartData,
    weatherChartData,
    weatherSummary,
    mandiChartData,
    mandiSummary,
    mandiRowsWithChange,
    mandiCategoryOptions,
    filteredMandiCrops,
    handleAnalyticsFetch,
    handleAnalyticsDownload,
    errorMessage
  } = useDashboardData({ isAdmin, t });

  const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;

  const latestRecommendation = operationsOverview?.recent_runs?.[0]?.operation
    ? operationsOverview.recent_runs[0].operation.replace(/_/g, " ")
    : "--";
  const waterSavingsValue = weatherSummary ? `${weatherSummary.avgRain.toFixed(1)} mm` : "--";
  const sustainabilityValue = analyticsData ? `${analyticsData.average_sustainability.toFixed(1)}` : "--";

  return (
    <AppLayout fullBleed>
      <Stack spacing={{ xs: spacingScale.sm, md: spacingScale.md }}>
        <HeroCarouselSection
          slides={AGRI_SLIDES}
          visibleSlideCount={visibleSlideCount}
          carouselRef={carouselRef}
          onScroll={handleCarouselScroll}
          onPrev={showPrevSlide}
          onNext={showNextSlide}
        />

        <HeroOverviewSection
          t={t}
          onNavigateCrop={() => navigate("/services/crop")}
          onNavigatePrice={() => navigate("/services/price")}
          onNavigateWater={() => navigate("/services/water")}
          onNavigateAdvisory={() => navigate("/advisory")}
          onOpenOnboarding={() => setOnboardingOpen(true)}
          onboardingStartLabel={onboardingLabels.startTour}
          wsUrl={wsUrl}
          wsStatus={wsStatus}
          isOffline={isOffline}
          latestRecommendation={latestRecommendation}
          waterSavingsValue={waterSavingsValue}
          sustainabilityValue={sustainabilityValue}
        />

        <ImportantLinksSection t={t} />

        <RealtimeUpdatesSection t={t} wsStatus={wsStatus} events={realtimeEvents} />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <OfficerAnalyticsSection
          isOfficer={isOfficer}
          isAdmin={isAdmin}
          t={t}
          analyticsFilters={analyticsFilters}
          setAnalyticsFilters={setAnalyticsFilters}
          analyticsData={analyticsData}
          farmersNeedingAttention={farmersNeedingAttention}
          feedbackReliability={feedbackReliability}
          analyticsChartData={analyticsChartData}
          handleAnalyticsFetch={handleAnalyticsFetch}
          handleAnalyticsDownload={handleAnalyticsDownload}
          analyticsMutation={analyticsMutation}
          attentionMutation={attentionMutation}
          feedbackReliabilityMutation={feedbackReliabilityMutation}
          operationsOverview={operationsOverview}
          operationsOverviewMutation={operationsOverviewMutation}
          triggerWeeklyMutation={triggerWeeklyMutation}
          triggerQuarterlyMutation={triggerQuarterlyMutation}
          triggerDailyDataMutation={triggerDailyDataMutation}
        />

        <MarketDataSection
          t={t}
          weatherLocation={weatherLocation}
          setWeatherLocation={setWeatherLocation}
          weatherDays={weatherDays}
          setWeatherDays={setWeatherDays}
          weatherMutation={weatherMutation}
          weatherResult={weatherResult}
          weatherSummary={weatherSummary}
          weatherView={weatherView}
          setWeatherView={setWeatherView}
          weatherChartData={weatherChartData}
          mandiCategory={mandiCategory}
          setMandiCategory={setMandiCategory}
          mandiCategoryOptions={mandiCategoryOptions}
          filteredMandiCrops={filteredMandiCrops}
          mandiForm={mandiForm}
          setMandiForm={setMandiForm}
          mandiMarkets={mandiCatalogData.markets}
          mandiMutation={mandiMutation}
          mandiSummary={mandiSummary}
          mandiResult={mandiResult}
          mandiChartData={mandiChartData}
          showMandiTable={showMandiTable}
          setShowMandiTable={setShowMandiTable}
          mandiRowsWithChange={mandiRowsWithChange}
        />

        <NoticesGallerySection t={t} />
      </Stack>
      <OnboardingDialog
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />
    </AppLayout>
  );
};

export default DashboardPage;


