import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "../../../store/hooks";
import { FALLBACK_MANDI_CATALOG } from "../../../pages/dashboard/constants";
import { fetchMandiCatalog } from "../../../services/integrations";
import { fetchMandiDirectory } from "../../../services/mandiDirectory";
import { resolveWsUrl } from "../../../services/runtimeConfig";
import { useWebSocket } from "../../../utils/useWebSocket";
import type {
  LiveTransportMode,
  MandiTradingFilters,
  MandiTradingSnapshot,
  TradingTimeframe,
} from "../types";
import useDebouncedValue from "./useDebouncedValue";
import {
  buildTradingSnapshotQueryKey,
  buildTradingSummary,
  fetchMandiTradingSnapshot,
  matchesRealtimeTick,
  mergeRealtimeTick,
  parseRealtimeMandiEvent,
} from "../services/mandiTradingService";

const DEFAULT_FILTERS: MandiTradingFilters = {
  crop: "Rice",
  state: "Bihar",
  mandi: "Patna",
  timeframe: 7,
};

const normalizeText = (value?: string | null) => String(value || "").trim();
const normalizeKey = (value?: string | null) => normalizeText(value).toLowerCase();

const uniqueSorted = (items: string[]) =>
  Array.from(new Set(items.map((item) => normalizeText(item)).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right),
  );

const sameValue = (left?: string | null, right?: string | null) =>
  normalizeKey(left) === normalizeKey(right);

export const useMandiTradingDashboard = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MandiTradingFilters>(DEFAULT_FILTERS);
  const [hasRealtimeMarketFeed, setHasRealtimeMarketFeed] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ["mandi-trading-catalog"],
    queryFn: () => fetchMandiCatalog({ limit: 1500 }),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const directoryQuery = useQuery({
    queryKey: ["mandi-trading-directory"],
    queryFn: () => fetchMandiDirectory({ limit: 800 }),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const catalog =
    catalogQuery.data && catalogQuery.data.crops.length > 0
      ? catalogQuery.data
      : FALLBACK_MANDI_CATALOG;
  const directoryItems = directoryQuery.data || [];

  const cropOptions = useMemo(
    () => uniqueSorted(catalog.crops.map((item) => item.crop)),
    [catalog.crops],
  );
  const stateOptions = useMemo(
    () => uniqueSorted(directoryItems.map((item) => item.state)),
    [directoryItems],
  );
  const mandiOptions = useMemo(() => {
    const filteredDirectory = filters.state
      ? directoryItems.filter((item) => sameValue(item.state, filters.state))
      : directoryItems;
    const directoryMandis = uniqueSorted(filteredDirectory.map((item) => item.name));
    return directoryMandis.length ? directoryMandis : uniqueSorted(catalog.markets);
  }, [catalog.markets, directoryItems, filters.state]);

  const resolvedState = useMemo(() => {
    if (filters.state) return filters.state;
    const match = directoryItems.find((item) => sameValue(item.name, filters.mandi));
    return match?.state || "";
  }, [directoryItems, filters.mandi, filters.state]);

  useEffect(() => {
    if (!cropOptions.length) return;
    if (!cropOptions.some((item) => sameValue(item, filters.crop))) {
      const preferred =
        cropOptions.find((item) => sameValue(item, DEFAULT_FILTERS.crop)) || cropOptions[0];
      setFilters((current) => ({ ...current, crop: preferred }));
    }
  }, [cropOptions, filters.crop]);

  useEffect(() => {
    if (!stateOptions.length) return;
    if (!stateOptions.some((item) => sameValue(item, filters.state))) {
      const preferred =
        stateOptions.find((item) => sameValue(item, DEFAULT_FILTERS.state)) || stateOptions[0];
      setFilters((current) => ({ ...current, state: preferred }));
    }
  }, [filters.state, stateOptions]);

  useEffect(() => {
    if (!mandiOptions.length) return;
    if (!mandiOptions.some((item) => sameValue(item, filters.mandi))) {
      const preferred =
        mandiOptions.find((item) => sameValue(item, DEFAULT_FILTERS.mandi)) || mandiOptions[0];
      setFilters((current) => ({ ...current, mandi: preferred }));
    }
  }, [filters.mandi, mandiOptions]);

  const debouncedFilters = useDebouncedValue<MandiTradingFilters>(
    {
      ...filters,
      state: resolvedState,
    },
    350,
  );

  const snapshotQueryKey = useMemo(
    () => buildTradingSnapshotQueryKey(debouncedFilters),
    [debouncedFilters],
  );
  const wsBaseUrl = resolveWsUrl(import.meta.env.VITE_WS_URL as string | undefined);
  const wsUrl = accessToken ? wsBaseUrl : undefined;
  const wsAuthMessage = accessToken
    ? JSON.stringify({ type: "auth", token: accessToken })
    : undefined;
  const { status: wsStatus, lastEvent, sendMessage } = useWebSocket(wsUrl, wsAuthMessage);

  const snapshotQuery = useQuery({
    queryKey: snapshotQueryKey,
    queryFn: () => fetchMandiTradingSnapshot(debouncedFilters),
    enabled: Boolean(debouncedFilters.crop && debouncedFilters.mandi),
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: hasRealtimeMarketFeed && wsStatus === "open" ? false : 8000,
  });

  useEffect(() => {
    setHasRealtimeMarketFeed(false);
  }, [debouncedFilters.crop, debouncedFilters.mandi, debouncedFilters.state, wsStatus]);

  useEffect(() => {
    if (wsStatus !== "open") return;
    const interval = window.setInterval(() => {
      sendMessage("ping");
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [sendMessage, wsStatus]);

  useEffect(() => {
    if (!lastEvent) return;
    const tick = parseRealtimeMandiEvent(lastEvent);
    if (!tick || !matchesRealtimeTick(tick, debouncedFilters)) {
      return;
    }

    setHasRealtimeMarketFeed(true);
    queryClient.setQueryData<MandiTradingSnapshot>(snapshotQueryKey, (current) => {
      const nextHistory = mergeRealtimeTick(
        current?.history || [],
        tick,
        debouncedFilters.timeframe,
      );
      return {
        history: nextHistory,
        summary: buildTradingSummary(nextHistory, tick.timestamp),
        gainers: current?.gainers || [],
        losers: current?.losers || [],
        staleDataWarning: current?.staleDataWarning || null,
        updatedAt: tick.timestamp,
        source: current?.source || "websocket",
        isCached: false,
        offline: false,
      };
    });
  }, [debouncedFilters, lastEvent, queryClient, snapshotQueryKey]);

  const transportMode: LiveTransportMode =
    wsStatus === "open" && hasRealtimeMarketFeed ? "websocket" : "polling";
  const snapshot = snapshotQuery.data || null;
  const recentTape = useMemo(
    () => [...(snapshot?.history || [])].slice(-6).reverse(),
    [snapshot?.history],
  );

  const setFilter = (key: "crop" | "state" | "mandi", value: string) => {
    setFilters((current) => {
      if (key === "state" && !sameValue(current.state, value)) {
        return { ...current, state: value, mandi: "" };
      }
      return { ...current, [key]: value };
    });
  };

  const setTimeframe = (timeframe: TradingTimeframe) => {
    setFilters((current) => ({ ...current, timeframe }));
  };

  return {
    filters,
    snapshot,
    cropOptions,
    stateOptions,
    mandiOptions,
    resolvedState,
    recentTape,
    wsStatus,
    transportMode,
    isBootstrapping: (catalogQuery.isLoading || directoryQuery.isLoading) && !snapshot,
    isRefreshing: snapshotQuery.isFetching && Boolean(snapshot),
    isSnapshotLoading: snapshotQuery.isLoading && !snapshot,
    error: snapshotQuery.error || catalogQuery.error || directoryQuery.error || null,
    refresh: () => snapshotQuery.refetch(),
    setFilter,
    setTimeframe,
  };
};

export default useMandiTradingDashboard;
