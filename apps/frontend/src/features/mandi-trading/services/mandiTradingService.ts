import { cachedGet } from "../../../services/apiClient";
import type { MarketPriceTable } from "../../../services/dashboard";
import type { MandiPriceResponse } from "../../../services/integrations";
import type {
  MandiMover,
  MandiTradingFilters,
  MandiTradingPoint,
  MandiTradingSnapshot,
  MandiTradingSummary,
  RealtimeMandiEvent,
} from "../types";

const LIVE_TTL_MS = 1000 * 15;
const MOVER_LIMIT = 300;
const LEADERBOARD_LIMIT = 5;

const normalizeText = (value?: string | null) => String(value || "").trim();
const normalizeKey = (value?: string | null) => normalizeText(value).toLowerCase();

const coerceNumber = (value: unknown): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const toIsoTimestamp = (value: unknown): string => {
  const raw = normalizeText(
    typeof value === "string" || value instanceof Date ? String(value) : "",
  );
  const parsed = raw ? new Date(raw) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const sortByTimestamp = (left: { timestamp: string }, right: { timestamp: string }) =>
  new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();

const withinWindow = (
  timestamp: string,
  referenceTimestamp: string,
  timeframe: MandiTradingFilters["timeframe"],
) => {
  const itemTime = new Date(timestamp).getTime();
  const referenceTime = new Date(referenceTimestamp).getTime();
  if (!Number.isFinite(itemTime) || !Number.isFinite(referenceTime)) return true;
  const windowMs = Math.max(1, timeframe) * 24 * 60 * 60 * 1000;
  return itemTime >= referenceTime - windowMs;
};

const buildSnapshotCacheKey = (filters: MandiTradingFilters) =>
  `mandi_trading_snapshot:${normalizeKey(filters.crop)}:${normalizeKey(filters.state)}:${normalizeKey(filters.mandi)}:${filters.timeframe}`;

const buildMoversCacheKey = (filters: MandiTradingFilters) =>
  `mandi_trading_movers:${normalizeKey(filters.state)}:${normalizeKey(filters.mandi)}`;

export const buildTradingSnapshotQueryKey = (filters: MandiTradingFilters) =>
  [
    "mandi-trading-snapshot",
    normalizeKey(filters.crop),
    normalizeKey(filters.state),
    normalizeKey(filters.mandi),
    filters.timeframe,
  ] as const;

export const normalizeMandiHistory = (
  response: MandiPriceResponse,
  state: string,
): MandiTradingPoint[] =>
  response.prices
    .map((point) => ({
      crop: normalizeText(response.crop),
      mandi: normalizeText(response.market),
      state: normalizeText(state),
      price: coerceNumber(point.price),
      timestamp: toIsoTimestamp(point.date),
    }))
    .filter((point) => point.crop && point.mandi && Number.isFinite(point.price))
    .sort(sortByTimestamp);

export const buildTradingSummary = (
  history: MandiTradingPoint[],
  updatedAt?: string,
): MandiTradingSummary | null => {
  if (!history.length) return null;

  const currentPoint = history[history.length - 1];
  const previousPoint = history[history.length - 2] || currentPoint;
  const prices = history.map((item) => item.price);
  const previousPrice = previousPoint.price || currentPoint.price;
  const changePct =
    previousPrice === 0 ? 0 : ((currentPoint.price - previousPrice) / previousPrice) * 100;

  return {
    currentPrice: currentPoint.price,
    previousPrice,
    changePct,
    highPrice: Math.max(...prices),
    lowPrice: Math.min(...prices),
    lastUpdated: updatedAt || currentPoint.timestamp,
  };
};

export const aggregateMoversFromMarketRows = (
  rows: MarketPriceTable["items"],
  filters: Pick<MandiTradingFilters, "state" | "mandi">,
) => {
  const grouped = new Map<string, MarketPriceTable["items"]>();

  rows.forEach((row) => {
    const crop = normalizeText(row.commodity);
    const mandi = normalizeText(row.market);
    const state = normalizeText(filters.state);
    const currentPrice = coerceNumber(row.price);

    if (!crop || !mandi || !Number.isFinite(currentPrice)) {
      return;
    }
    if (filters.mandi && normalizeKey(mandi) !== normalizeKey(filters.mandi)) {
      return;
    }

    const key = `${normalizeKey(crop)}||${normalizeKey(mandi)}||${normalizeKey(state)}`;
    const current = grouped.get(key) || [];
    current.push(row);
    grouped.set(key, current);
  });

  const movers: MandiMover[] = Array.from(grouped.values())
    .map((bucket) => {
      const ordered = [...bucket].sort(
        (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
      );
      const latest = ordered[ordered.length - 1];
      const previous = ordered[ordered.length - 2] || latest;
      const latestPrice = coerceNumber(latest.price);
      const previousPrice = coerceNumber(previous.price);

      if (!Number.isFinite(latestPrice) || !Number.isFinite(previousPrice)) {
        return null;
      }

      const changePct =
        previousPrice === 0 ? 0 : ((latestPrice - previousPrice) / previousPrice) * 100;

      return {
        crop: normalizeText(latest.commodity),
        mandi: normalizeText(latest.market),
        state: normalizeText(filters.state),
        currentPrice: latestPrice,
        previousPrice,
        changePct,
        timestamp: toIsoTimestamp(latest.date),
      };
    })
    .filter((item): item is MandiMover => Boolean(item))
    .sort((left, right) => right.changePct - left.changePct);

  return {
    gainers: movers.filter((item) => item.changePct >= 0).slice(0, LEADERBOARD_LIMIT),
    losers: [...movers]
      .reverse()
      .filter((item) => item.changePct < 0)
      .slice(0, LEADERBOARD_LIMIT),
  };
};

export const matchesRealtimeTick = (tick: RealtimeMandiEvent, filters: MandiTradingFilters) => {
  if (normalizeKey(tick.crop) !== normalizeKey(filters.crop)) return false;
  if (normalizeKey(tick.mandi) !== normalizeKey(filters.mandi)) return false;
  if (filters.state && tick.state && normalizeKey(tick.state) !== normalizeKey(filters.state))
    return false;
  return true;
};

export const mergeRealtimeTick = (
  history: MandiTradingPoint[],
  tick: RealtimeMandiEvent,
  timeframe: MandiTradingFilters["timeframe"],
) => {
  const nextHistory = [
    ...history.filter(
      (item) =>
        !(
          normalizeKey(item.crop) === normalizeKey(tick.crop) &&
          normalizeKey(item.mandi) === normalizeKey(tick.mandi) &&
          item.timestamp === tick.timestamp
        ),
    ),
    tick,
  ].sort(sortByTimestamp);

  const referenceTimestamp = nextHistory[nextHistory.length - 1]?.timestamp || tick.timestamp;
  return nextHistory.filter((item) => withinWindow(item.timestamp, referenceTimestamp, timeframe));
};

export const parseRealtimeMandiEvent = (
  event: Record<string, unknown>,
): RealtimeMandiEvent | null => {
  const crop = normalizeText(String(event.crop ?? event.commodity ?? ""));
  const mandi = normalizeText(String(event.mandi ?? event.market ?? ""));
  const state = normalizeText(String(event.state ?? ""));
  const price = coerceNumber(
    event.price ?? event.modal_price ?? event.current_price ?? event.avg_price,
  );

  if (!crop || !mandi || !Number.isFinite(price)) {
    return null;
  }

  return {
    crop,
    mandi,
    state,
    price,
    timestamp: toIsoTimestamp(
      event.timestamp ?? event.server_time ?? event.fetched_at ?? event.arrival_date,
    ),
    eventType: normalizeText(String(event.event ?? event.type ?? "")),
  };
};

export const fetchMandiTradingSnapshot = async (
  filters: MandiTradingFilters,
): Promise<MandiTradingSnapshot> => {
  const [priceResult, moversResult] = await Promise.allSettled([
    cachedGet<MandiPriceResponse>(
      "/integrations/mandi-prices",
      {
        params: {
          crop: filters.crop.trim(),
          market: filters.mandi.trim(),
          days: filters.timeframe,
        },
      },
      {
        store: "mandi",
        key: buildSnapshotCacheKey(filters),
        ttlMs: LIVE_TTL_MS,
        retry: 1,
      },
    ),
    cachedGet<MarketPriceTable>(
      "/dashboard/market-prices",
      {
        params: {
          state: filters.state.trim() || undefined,
          mandi: filters.mandi.trim() || undefined,
          page: 1,
          page_size: Math.min(MOVER_LIMIT, 100),
        },
      },
      {
        store: "mandi",
        key: buildMoversCacheKey(filters),
        ttlMs: LIVE_TTL_MS,
        retry: 1,
      },
    ),
  ]);

  if (priceResult.status === "rejected") {
    throw priceResult.reason;
  }

  const pricePayload = priceResult.value;
  const history = normalizeMandiHistory(pricePayload.data, filters.state);
  const movers =
    moversResult.status === "fulfilled"
      ? aggregateMoversFromMarketRows(moversResult.value.data.items, filters)
      : { gainers: [], losers: [] };
  const updatedAt =
    pricePayload.data.last_updated ||
    pricePayload.meta.updatedAt ||
    pricePayload.data.fetched_at ||
    new Date().toISOString();

  return {
    history,
    summary: buildTradingSummary(history, updatedAt),
    gainers: movers.gainers,
    losers: movers.losers,
    staleDataWarning: pricePayload.data.stale_data_warning,
    updatedAt,
    source: pricePayload.data.source,
    isCached: pricePayload.meta.cached,
    offline: pricePayload.meta.offline,
  };
};
