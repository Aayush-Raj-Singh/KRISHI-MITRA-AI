import React, { Suspense } from "react";
import {
  Alert,
  Box,
  Typography,
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
const MarketDataSection = React.lazy(() => import("./dashboard/sections/MarketDataSection"));
const NoticesGallerySection = React.lazy(() => import("./dashboard/sections/NoticesGallerySection"));
const OfficerAnalyticsSection = React.lazy(() => import("./dashboard/sections/OfficerAnalyticsSection"));
const ImportantLinksSection = React.lazy(() => import("./dashboard/sections/ImportantLinksSection"));

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
  const { wsStatus, wsUrl } = useDashboardRealtime(accessToken);
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
    mandiForm,
    setMandiForm,
    mandiCategory,
    setMandiCategory,
    mandiResult,
    showMandiTable,
    setShowMandiTable,
    analyticsMutation,
    reportExportMutation,
    operationsOverviewMutation,
    triggerWeeklyMutation,
    triggerQuarterlyMutation,
    triggerDailyDataMutation,
    mandiMutation,
    analyticsChartData,
    mandiChartData,
    mandiSummary,
    mandiRowsWithChange,
    mandiCategoryOptions,
    filteredMandiCrops,
    mandiMarkets,
    nearestMarkets,
    mandiCards,
    locationLabel,
    handleAnalyticsFetch,
    handleAnalyticsExport,
    errorMessage
  } = useDashboardData({ isOfficer, isAdmin, t });

  const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;

  const latestRecommendation = operationsOverview?.recent_runs?.[0]?.operation
    ? operationsOverview.recent_runs[0].operation.replace(/_/g, " ")
    : "--";
  const waterSavingsValue = "--";
  const sustainabilityValue = analyticsData ? `${analyticsData.average_sustainability.toFixed(1)}` : "--";
  const sectionFallback = (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px dashed var(--surface-border)",
        background: "var(--surface-soft)"
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t("actions.loading", { defaultValue: "Loading..." })}
      </Typography>
    </Box>
  );

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
          onNavigateCrop={() => navigate("/services/farm-operations?tab=crop")}
          onNavigatePrice={() => navigate("/services/market-intelligence?tab=price")}
          onNavigateWater={() => navigate("/services/farm-operations?tab=water")}
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

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Suspense fallback={sectionFallback}>
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
            handleAnalyticsExport={handleAnalyticsExport}
            isExportingReport={reportExportMutation.isPending}
            exportingReportFormat={reportExportMutation.variables?.format ?? null}
            analyticsMutation={analyticsMutation}
            operationsOverview={operationsOverview}
            operationsOverviewMutation={operationsOverviewMutation}
            triggerWeeklyMutation={triggerWeeklyMutation}
            triggerQuarterlyMutation={triggerQuarterlyMutation}
            triggerDailyDataMutation={triggerDailyDataMutation}
          />
        </Suspense>

        <Suspense fallback={sectionFallback}>
          <MarketDataSection
            t={t}
            mandiCategory={mandiCategory}
            setMandiCategory={setMandiCategory}
            mandiCategoryOptions={mandiCategoryOptions}
            filteredMandiCrops={filteredMandiCrops}
            mandiForm={mandiForm}
            setMandiForm={setMandiForm}
            mandiMarkets={mandiMarkets}
            mandiMutation={mandiMutation}
            mandiSummary={mandiSummary}
            mandiResult={mandiResult}
            mandiChartData={mandiChartData}
            showMandiTable={showMandiTable}
            setShowMandiTable={setShowMandiTable}
            mandiRowsWithChange={mandiRowsWithChange}
            nearestMarkets={nearestMarkets}
            mandiCards={mandiCards}
            locationLabel={locationLabel}
          />
        </Suspense>

        <Suspense fallback={sectionFallback}>
          <NoticesGallerySection t={t} />
        </Suspense>

        <Suspense fallback={sectionFallback}>
          <ImportantLinksSection t={t} />
        </Suspense>
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


