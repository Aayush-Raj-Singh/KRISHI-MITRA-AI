import type { Role } from "@krishimitra/shared";

type ModuleRoute = {
  route: string;
  title: string;
  icon: string;
  params?: Record<string, string>;
};

export const loginShowcasePoints = [
  { icon: "verified" as const, text: "Crop, market, and irrigation workflows in one account." },
  {
    icon: "tips-and-updates" as const,
    text: "Personalized advisory powered by the active AI runtime.",
  },
  { icon: "translate" as const, text: "Multilingual guidance designed for Indian field teams." },
  { icon: "campaign" as const, text: "Government-style portal experience adapted for mobile." },
];

export const registerShowcasePoints = [
  {
    icon: "water-drop" as const,
    text: "Capture irrigation, soil, and crop context during registration.",
  },
  { icon: "query-stats" as const, text: "Use the same backend account across web and mobile." },
  { icon: "eco" as const, text: "Track sustainability, outcome feedback, and field planning." },
  { icon: "agriculture" as const, text: "Designed for farmers, officers, and admins." },
];

export const serviceCatalog = [
  {
    route: "FarmOperations",
    icon: "agriculture" as const,
    title: "Farm Operations",
    description: "Crop planning and irrigation optimization with shared farm inputs.",
    meta: "Crop + Water",
  },
  {
    route: "MarketIntelligence",
    icon: "insights" as const,
    title: "Market Intelligence",
    description: "Forecasts, arrivals, trends, and alert signals in one workspace.",
    meta: "Price + Arrival + Trends",
  },
  {
    route: "Feedback",
    icon: "rate-review" as const,
    title: "Outcome Feedback",
    description: "Capture field outcomes, sustainability signals, and queued sync status.",
    meta: "Feedback",
  },
  {
    route: "MarketDirectory",
    icon: "storefront" as const,
    title: "Market Directory",
    description: "Browse mandi profiles, facilities, timing, and commodity coverage.",
    meta: "Directory",
  },
  {
    route: "Helpdesk",
    icon: "support-agent" as const,
    title: "Helpdesk",
    description: "Raise support tickets, send replies, and monitor issue status.",
    meta: "Support",
  },
  {
    route: "ModernFarming",
    icon: "auto-awesome" as const,
    title: "Modern Farming",
    description: "Explore the guided crop and vegetable library from the web portal.",
    meta: "Guide Library",
  },
  {
    route: "Disease",
    icon: "bug-report" as const,
    title: "Disease Detection",
    description: "Capture crop images and review treatment, prevention, and follow-up guidance.",
    meta: "Vision + Advisory",
  },
];

export const notices = [
  { title: "Monsoon advisory bulletin released for kharif planning.", date: "12 Jun" },
  { title: "Market arrivals update published for key vegetable clusters.", date: "09 Jun" },
  { title: "Irrigation efficiency drive open for new field enrollments.", date: "05 Jun" },
  { title: "District agronomy review scheduled for extension teams.", date: "02 Jun" },
];

export const importantLinks = [
  {
    label: "Beneficiary status and registration support",
    route: "Portal",
    icon: "assignment-turned-in" as const,
    description: "Open the role-based service portal.",
  },
  {
    label: "Farmer registration assistance",
    route: "Register",
    icon: "person-add-alt-1" as const,
    description: "Create a new user account from mobile.",
  },
  {
    label: "Market price bulletin and trend snapshots",
    route: "TrendAnalytics",
    icon: "query-stats" as const,
    description: "Jump straight to price-trend intelligence.",
  },
  {
    label: "Helpline and officer escalation channel",
    route: "Helpdesk",
    icon: "support-agent" as const,
    description: "Reach the ticketing and support queue.",
  },
];

export const portalModulesByRole: Record<Role, ModuleRoute[]> = {
  admin: [
    { route: "AdminMasterData", title: "Admin Master Data", icon: "inventory-2" },
    { route: "TrendAnalytics", title: "Market Intelligence", icon: "insights" },
    { route: "Disease", title: "Disease Detection", icon: "bug-report" },
    { route: "AuditLogs", title: "Audit Logs", icon: "history" },
    { route: "DataQuality", title: "Data Quality", icon: "rule" },
  ],
  extension_officer: [
    { route: "OfficerWorkflow", title: "Officer Workflow", icon: "edit-note" },
    { route: "MarketDirectory", title: "Market Directory", icon: "storefront" },
    { route: "PriceArrivalDashboard", title: "Market Intelligence", icon: "insights" },
    { route: "Disease", title: "Disease Detection", icon: "bug-report" },
    { route: "CropRecommendation", title: "Farm Operations", icon: "agriculture" },
  ],
  farmer: [
    { route: "PriceForecast", title: "Market Intelligence", icon: "insights" },
    { route: "CropRecommendation", title: "Farm Operations", icon: "agriculture" },
    { route: "Disease", title: "Disease Detection", icon: "bug-report" },
    { route: "MarketDirectory", title: "Market Directory", icon: "storefront" },
    { route: "Helpdesk", title: "Helpdesk", icon: "support-agent" },
  ],
  fpo: [
    { route: "PriceForecast", title: "Market Intelligence", icon: "insights" },
    { route: "MarketDirectory", title: "Market Directory", icon: "storefront" },
    { route: "TrendAnalytics", title: "Trend Analytics", icon: "query-stats" },
    { route: "Helpdesk", title: "Helpdesk", icon: "support-agent" },
    { route: "Portal", title: "Portal", icon: "dashboard-customize" },
  ],
  agri_business: [
    { route: "TrendAnalytics", title: "Trend Analytics", icon: "query-stats" },
    { route: "PriceForecast", title: "Market Intelligence", icon: "insights" },
    { route: "MarketDirectory", title: "Market Directory", icon: "storefront" },
    { route: "Helpdesk", title: "Helpdesk", icon: "support-agent" },
    { route: "Portal", title: "Portal", icon: "dashboard-customize" },
  ],
  government_agency: [
    { route: "OfficerWorkflow", title: "Officer Workflow", icon: "edit-note" },
    { route: "TrendAnalytics", title: "Market Intelligence", icon: "query-stats" },
    { route: "PriceArrivalDashboard", title: "Price Arrival Dashboard", icon: "insights" },
    { route: "MarketDirectory", title: "Market Directory", icon: "storefront" },
    { route: "Portal", title: "Portal", icon: "dashboard-customize" },
  ],
};
