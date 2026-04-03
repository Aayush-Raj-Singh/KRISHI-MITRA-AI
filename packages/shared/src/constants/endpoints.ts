export const API_ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    requestPasswordReset: "/auth/request-password-reset",
    resetPassword: "/auth/reset-password",
    refresh: "/auth/refresh",
    refreshAlias: "/auth/refresh-token",
    logout: "/auth/logout",
    me: "/auth/me",
    roles: "/auth/roles",
  },
  dashboard: {
    heroSummary: "/dashboard/hero-summary",
    priceArrival: "/dashboard/price-arrival",
    marketPrices: "/dashboard/market-prices",
    metrics: "/dashboard/metrics",
    regionalInsights: "/dashboard/regional-insights",
  },
  stateEngine: {
    catalog: "/state-engine/catalog",
    resolve: "/state-engine/resolve",
    intelligence: "/state-engine/intelligence",
  },
  platform: {
    blueprint: "/platform/blueprint",
    workspace: "/platform/workspace",
    hierarchy: "/platform/hierarchy",
    subscriptions: "/platform/subscriptions",
  },
  analytics: {
    trends: "/analytics/trends",
  },
  alerts: {
    market: "/alerts/market",
  },
  recommendations: {
    crop: "/recommendations/crop",
    priceForecast: "/recommendations/price-forecast",
    waterOptimization: "/recommendations/water-optimization",
  },
  directory: {
    mandi: "/mandi-directory",
  },
  support: {
    tickets: "/tickets",
  },
  advisory: {
    chat: "/advisory/chat",
    history: "/advisory/history",
    telemetrySla: "/advisory/telemetry/sla",
    translate: "/advisory/translate",
  },
  ai: {
    advisor: "/api/ai/advisor",
  },
  disease: {
    predict: "/disease/predict",
    history: "/disease/history",
  },
  feedback: {
    outcome: "/feedback/outcome",
    quick: "/feedback/quick",
    rating: "/feedback/rating",
  },
} as const;

export const WS_ENDPOINTS = {
  updates: "/ws/updates",
  health: "/ws/health",
} as const;
