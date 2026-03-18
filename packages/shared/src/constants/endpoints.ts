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
    roles: "/auth/roles"
  },
  dashboard: {
    heroSummary: "/dashboard/hero-summary",
    priceArrival: "/dashboard/price-arrival",
    metrics: "/dashboard/metrics",
    regionalInsights: "/dashboard/regional-insights"
  },
  recommendations: {
    crop: "/recommendations/crop",
    priceForecast: "/recommendations/price-forecast",
    waterOptimization: "/recommendations/water-optimization"
  },
  advisory: {
    chat: "/advisory/chat",
    history: "/advisory/history",
    telemetrySla: "/advisory/telemetry/sla",
    translate: "/advisory/translate"
  },
  disease: {
    predict: "/disease/predict",
    history: "/disease/history"
  },
  feedback: {
    outcome: "/feedback/outcome",
    quick: "/feedback/quick",
    rating: "/feedback/rating"
  }
} as const;

export const WS_ENDPOINTS = {
  updates: "/ws/updates",
  health: "/ws/health"
} as const;
