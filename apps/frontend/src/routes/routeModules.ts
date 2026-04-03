import React from "react";

type RouteImporter<T extends React.ComponentType<any>> = () => Promise<{ default: T }>;

type LazyRouteComponent<T extends React.ComponentType<any>> = React.LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};

const routeImporters = {
  landing: () => import("../pages/LandingPage"),
  advisory: () => import("../pages/AdvisoryPage"),
  adminMasterData: () => import("../pages/AdminMasterDataPage"),
  auditLogs: () => import("../pages/AuditLogsPage"),
  dashboard: () => import("../pages/DashboardPage"),
  dataQuality: () => import("../pages/DataQualityPage"),
  diseaseDetection: () => import("../pages/DiseaseDetection"),
  helpdesk: () => import("../pages/HelpdeskPage"),
  marketDirectory: () => import("../pages/MarketDirectoryPage"),
  marketIntelligence: () => import("../pages/MarketIntelligencePage"),
  notices: () => import("../pages/NoticesPage"),
  officerWorkflow: () => import("../pages/OfficerWorkflowPage"),
  outcomeFeedback: () => import("../pages/OutcomeFeedbackPage"),
  portal: () => import("../pages/PortalPage"),
  profile: () => import("../pages/ProfilePage"),
  modernFarming: () => import("../pages/ModernFarmingPage"),
  services: () => import("../pages/ServicesPage"),
  farmOperations: () => import("../pages/FarmOperationsPage"),
  nationalAgricultureIntelligence: () => import("../pages/NationalAgricultureIntelligencePage"),
} satisfies Record<string, RouteImporter<React.ComponentType<any>>>;

const lazyWithPreload = <T extends React.ComponentType<any>>(
  importer: RouteImporter<T>,
): LazyRouteComponent<T> => {
  const Component = React.lazy(importer) as LazyRouteComponent<T>;
  Component.preload = importer;
  return Component;
};

export const LandingPageLazy = lazyWithPreload(routeImporters.landing);
export const AdvisoryPageLazy = lazyWithPreload(routeImporters.advisory);
export const AdminMasterDataPageLazy = lazyWithPreload(routeImporters.adminMasterData);
export const AuditLogsPageLazy = lazyWithPreload(routeImporters.auditLogs);
export const DashboardPageLazy = lazyWithPreload(routeImporters.dashboard);
export const DataQualityPageLazy = lazyWithPreload(routeImporters.dataQuality);
export const DiseaseDetectionPageLazy = lazyWithPreload(routeImporters.diseaseDetection);
export const HelpdeskPageLazy = lazyWithPreload(routeImporters.helpdesk);
export const MarketDirectoryPageLazy = lazyWithPreload(routeImporters.marketDirectory);
export const MarketIntelligencePageLazy = lazyWithPreload(routeImporters.marketIntelligence);
export const NoticesPageLazy = lazyWithPreload(routeImporters.notices);
export const OfficerWorkflowPageLazy = lazyWithPreload(routeImporters.officerWorkflow);
export const OutcomeFeedbackPageLazy = lazyWithPreload(routeImporters.outcomeFeedback);
export const PortalPageLazy = lazyWithPreload(routeImporters.portal);
export const ProfilePageLazy = lazyWithPreload(routeImporters.profile);
export const ModernFarmingPageLazy = lazyWithPreload(routeImporters.modernFarming);
export const ServicesPageLazy = lazyWithPreload(routeImporters.services);
export const FarmOperationsPageLazy = lazyWithPreload(routeImporters.farmOperations);
export const NationalAgricultureIntelligencePageLazy = lazyWithPreload(
  routeImporters.nationalAgricultureIntelligence,
);

const preloadGroups: Array<{ matches: RegExp; preload: () => Promise<unknown> }> = [
  { matches: /^\/$/, preload: LandingPageLazy.preload },
  { matches: /^\/dashboard(?:\/|$)/, preload: DashboardPageLazy.preload },
  { matches: /^\/portal(?:\/|$)/, preload: PortalPageLazy.preload },
  { matches: /^\/mandi-directory(?:\/|$)/, preload: MarketDirectoryPageLazy.preload },
  { matches: /^\/services(?:\/|$)/, preload: ServicesPageLazy.preload },
  {
    matches: /^\/services\/national-intelligence(?:\/|$)/,
    preload: NationalAgricultureIntelligencePageLazy.preload,
  },
  {
    matches: /^\/services\/market-intelligence(?:\/|$)/,
    preload: MarketIntelligencePageLazy.preload,
  },
  {
    matches: /^\/services\/farm-operations(?:\/|$)/,
    preload: FarmOperationsPageLazy.preload,
  },
  { matches: /^\/services\/feedback(?:\/|$)/, preload: OutcomeFeedbackPageLazy.preload },
  { matches: /^\/services\/modern-farming(?:\/|$)/, preload: ModernFarmingPageLazy.preload },
  { matches: /^\/helpdesk(?:\/|$)/, preload: HelpdeskPageLazy.preload },
  { matches: /^\/advisory(?:\/|$)/, preload: AdvisoryPageLazy.preload },
  { matches: /^\/notices(?:\/|$)/, preload: NoticesPageLazy.preload },
  { matches: /^\/disease-detection(?:\/|$)/, preload: DiseaseDetectionPageLazy.preload },
  { matches: /^\/profile(?:\/|$)/, preload: ProfilePageLazy.preload },
  { matches: /^\/officer\/workflow(?:\/|$)/, preload: OfficerWorkflowPageLazy.preload },
  { matches: /^\/admin\/master-data(?:\/|$)/, preload: AdminMasterDataPageLazy.preload },
  { matches: /^\/admin\/audit-logs(?:\/|$)/, preload: AuditLogsPageLazy.preload },
  { matches: /^\/admin\/quality(?:\/|$)/, preload: DataQualityPageLazy.preload },
];

const prefetchedPaths = new Set<string>();

export const preloadRouteModule = (path: string): Promise<unknown> | undefined => {
  if (!path || prefetchedPaths.has(path)) {
    return undefined;
  }
  const target = preloadGroups.find((item) => item.matches.test(path));
  if (!target) {
    return undefined;
  }
  prefetchedPaths.add(path);
  return target.preload().catch(() => {
    prefetchedPaths.delete(path);
  });
};

export const primeRouteModules = () => {
  const preloadAll = () => {
    void DashboardPageLazy.preload();
    void PortalPageLazy.preload();
    void MarketDirectoryPageLazy.preload();
    void MarketIntelligencePageLazy.preload();
    void FarmOperationsPageLazy.preload();
    void HelpdeskPageLazy.preload();
    void AdvisoryPageLazy.preload();
    void NoticesPageLazy.preload();
    void ServicesPageLazy.preload();
    void NationalAgricultureIntelligencePageLazy.preload();
  };

  if (typeof window === "undefined") {
    preloadAll();
    return;
  }

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number })
      .requestIdleCallback(() => preloadAll());
    return;
  }

  globalThis.setTimeout(preloadAll, 250);
};
