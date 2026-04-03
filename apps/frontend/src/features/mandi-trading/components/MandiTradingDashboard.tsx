import React, { Suspense, lazy, useMemo } from "react";

import { useTranslatedStrings } from "../../../utils/useTranslatedStrings";
import useMandiTradingDashboard from "../hooks/useMandiTradingDashboard";
import type { TradingTimeframe } from "../types";
import MandiTradingFilterSidebar from "./MandiTradingFilterSidebar";
import MandiTradingMoversPanel from "./MandiTradingMoversPanel";
import MandiTradingSkeleton from "./MandiTradingSkeleton";

const MandiTradingChart = lazy(() => import("./MandiTradingChart"));

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const timeframes: Array<{
  value: TradingTimeframe;
  copyKey: "timeframe1d" | "timeframe7d" | "timeframe30d";
}> = [
  { value: 1, copyKey: "timeframe1d" },
  { value: 7, copyKey: "timeframe7d" },
  { value: 30, copyKey: "timeframe30d" },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "--" : dateTimeFormatter.format(parsed);
};

const MandiTradingDashboard: React.FC = () => {
  const copy = useTranslatedStrings(
    useMemo(
      () => ({
        title: "Mandi Trading Terminal",
        subtitle:
          "A live, trading-style crop pricing desk with India-wide mandi filters, market movers, and fast chart refresh.",
        filtersTitle: "Filters",
        crop: "Crop",
        state: "State",
        mandi: "Mandi",
        currentPrice: "Current price",
        change: "Change",
        high: "High",
        low: "Low",
        lastSync: "Last sync",
        chartTitle: "Live price chart",
        chartSubtitle:
          "Line view of recent mandi price movement for the active crop and market selection.",
        tapeTitle: "Live tape",
        gainers: "Top gaining crops",
        losers: "Top losing crops",
        noMovers:
          "Not enough approved mandi entries are available yet to rank movers in this scope.",
        connection: "Connection",
        dataSource: "Data source",
        websocketLive: "WebSocket live",
        websocketReady: "WebSocket ready",
        pollingFallback: "Polling fallback",
        refresh: "Retry",
        refreshing: "Refreshing market feed...",
        stale: "Using cached or delayed market data while the feed catches up.",
        chartLoading: "Loading chart...",
        noChartData: "No recent price points are available for this crop and mandi.",
        priceLabel: "Price",
        mandiLabel: "Mandi",
        stateLabel: "State",
        current: "Current",
        marketDepth: "Market depth",
        sourceUnknown: "Unknown",
        realtimeLane: "Realtime lane",
        latestWindow: "Active window",
        timeframe1d: "1 Day",
        timeframe7d: "7 Days",
        timeframe30d: "30 Days",
        cached: "Cached",
        offline: "Offline snapshot",
        emptyState: "Awaiting feed data",
        selectedScope: "Selected scope",
        previousClose: "Previous print",
        websocketBridge: "WebSocket ready / polling market snapshots",
      }),
      [],
    ),
  );

  const {
    filters,
    snapshot,
    cropOptions,
    stateOptions,
    mandiOptions,
    resolvedState,
    recentTape,
    wsStatus,
    transportMode,
    isBootstrapping,
    isRefreshing,
    isSnapshotLoading,
    error,
    refresh,
    setFilter,
    setTimeframe,
  } = useMandiTradingDashboard();

  if (isBootstrapping) {
    return <MandiTradingSkeleton />;
  }

  const summary = snapshot?.summary;
  const changePct = summary?.changePct || 0;
  const isPositive = changePct >= 0;
  const changeClassName = isPositive ? "tw-text-emerald-300" : "tw-text-rose-300";
  const selectedScope =
    [filters.mandi, resolvedState].filter(Boolean).join(", ") || copy.emptyState;
  const transportLabel =
    transportMode === "websocket"
      ? copy.websocketLive
      : wsStatus === "open"
        ? copy.websocketBridge
        : copy.pollingFallback;
  const statusBadgeClassName =
    transportMode === "websocket"
      ? "tw-border-emerald-500/30 tw-bg-emerald-500/10 tw-text-emerald-300"
      : "tw-border-amber-500/30 tw-bg-amber-500/10 tw-text-amber-200";

  return (
    <section
      id="mandi-trading-terminal"
      className="render-smooth-section tw-rounded-[32px] tw-border tw-border-slate-800 tw-bg-slate-950 tw-p-4 tw-text-slate-100 tw-shadow-terminal md:tw-p-6 tw-animate-terminal-fade"
    >
      <div className="tw-flex tw-flex-col tw-gap-3 xl:tw-flex-row xl:tw-items-center xl:tw-justify-between">
        <div className="tw-space-y-2">
          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.32em] tw-text-emerald-300">
            {copy.realtimeLane}
          </p>
          <h2 className="tw-font-display tw-text-2xl tw-font-semibold tw-text-white md:tw-text-3xl">
            {copy.title}
          </h2>
          <p className="tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-slate-300">{copy.subtitle}</p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span
            className={`tw-rounded-full tw-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold ${statusBadgeClassName}`}
          >
            {transportLabel}
          </span>
          {snapshot?.isCached && (
            <span className="tw-rounded-full tw-border tw-border-slate-700 tw-bg-slate-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-slate-200">
              {copy.cached}
            </span>
          )}
          {snapshot?.offline && (
            <span className="tw-rounded-full tw-border tw-border-amber-500/30 tw-bg-amber-500/10 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-amber-200">
              {copy.offline}
            </span>
          )}
        </div>
      </div>

      {snapshot?.staleDataWarning && (
        <div className="tw-mt-4 tw-rounded-2xl tw-border tw-border-amber-500/30 tw-bg-amber-500/10 tw-px-4 tw-py-3 tw-text-sm tw-text-amber-100">
          {snapshot.staleDataWarning || copy.stale}
        </div>
      )}

      {error && (
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-rounded-2xl tw-border tw-border-rose-500/30 tw-bg-rose-500/10 tw-p-4 md:tw-flex-row md:tw-items-center md:tw-justify-between">
          <div className="tw-text-sm tw-text-rose-100">
            {error instanceof Error ? error.message : copy.stale}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-900"
          >
            {copy.refresh}
          </button>
        </div>
      )}

      <div className="tw-mt-6 tw-grid tw-gap-4 xl:tw-grid-cols-[280px_minmax(0,1fr)_320px]">
        <MandiTradingFilterSidebar
          filters={filters}
          cropOptions={cropOptions}
          stateOptions={stateOptions}
          mandiOptions={mandiOptions}
          onFilterChange={setFilter}
          labels={{
            title: copy.filtersTitle,
            crop: copy.crop,
            state: copy.state,
            mandi: copy.mandi,
            connection: copy.connection,
            dataSource: copy.dataSource,
            lastSync: copy.lastSync,
          }}
          transportLabel={transportLabel}
          sourceLabel={snapshot?.source || copy.sourceUnknown}
          updatedAtLabel={formatDateTime(snapshot?.updatedAt)}
        />

        <div className="tw-space-y-4">
          <div className="tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_240px]">
            <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
              <div className="tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-items-center md:tw-justify-between">
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.selectedScope}
                  </p>
                  <h3 className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-white">
                    {selectedScope}
                  </h3>
                </div>
                <div className="tw-flex tw-flex-wrap tw-gap-2">
                  {timeframes.map((timeframe) => (
                    <button
                      key={timeframe.value}
                      type="button"
                      onClick={() => setTimeframe(timeframe.value)}
                      className={
                        filters.timeframe === timeframe.value
                          ? "tw-rounded-full tw-border tw-border-emerald-400/40 tw-bg-emerald-400/15 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-emerald-200"
                          : "tw-rounded-full tw-border tw-border-slate-700 tw-bg-slate-950/60 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-slate-300"
                      }
                    >
                      {copy[timeframe.copyKey]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tw-mt-5 tw-grid tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.currentPrice}
                  </p>
                  <p className="tw-mt-2 tw-text-3xl tw-font-semibold tw-text-white">
                    {summary ? currencyFormatter.format(summary.currentPrice) : "--"}
                  </p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.change}
                  </p>
                  <p className={`tw-mt-2 tw-text-3xl tw-font-semibold ${changeClassName}`}>
                    {summary ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "--"}
                  </p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.high}
                  </p>
                  <p className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
                    {summary ? currencyFormatter.format(summary.highPrice) : "--"}
                  </p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.low}
                  </p>
                  <p className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
                    {summary ? currencyFormatter.format(summary.lowPrice) : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
              <div className="tw-space-y-4">
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.latestWindow}
                  </p>
                  <p className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
                    {copy[`timeframe${filters.timeframe}d` as const]}
                  </p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.previousClose}
                  </p>
                  <p className="tw-mt-2 tw-text-xl tw-font-semibold tw-text-white">
                    {summary ? currencyFormatter.format(summary.previousPrice) : "--"}
                  </p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.lastSync}
                  </p>
                  <p className="tw-mt-2 tw-text-sm tw-font-semibold tw-text-slate-100">
                    {formatDateTime(summary?.lastUpdated || snapshot?.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
            <div className="tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-items-center md:tw-justify-between">
              <div>
                <h3 className="tw-font-semibold tw-text-white">{copy.chartTitle}</h3>
                <p className="tw-mt-1 tw-text-sm tw-text-slate-400">{copy.chartSubtitle}</p>
              </div>
              {isRefreshing && (
                <span className="tw-text-xs tw-font-semibold tw-text-emerald-300">
                  {copy.refreshing}
                </span>
              )}
            </div>

            <div className="tw-mt-4 tw-h-[380px]">
              {isSnapshotLoading && !snapshot ? (
                <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-[24px] tw-border tw-border-dashed tw-border-slate-700 tw-bg-slate-950/40 tw-text-sm tw-text-slate-400">
                  {copy.chartLoading}
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-[24px] tw-border tw-border-dashed tw-border-slate-700 tw-bg-slate-950/40 tw-text-sm tw-text-slate-400">
                      {copy.chartLoading}
                    </div>
                  }
                >
                  <MandiTradingChart
                    points={snapshot?.history || []}
                    priceLabel={copy.priceLabel}
                    mandiLabel={copy.mandiLabel}
                    stateLabel={copy.stateLabel}
                    emptyLabel={copy.noChartData}
                  />
                </Suspense>
              )}
            </div>
          </div>

          <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <h3 className="tw-font-semibold tw-text-white">{copy.tapeTitle}</h3>
              <span className="tw-rounded-full tw-border tw-border-slate-700 tw-bg-slate-950/60 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-slate-300">
                {copy.marketDepth}: {recentTape.length}
              </span>
            </div>

            <div className="tw-mt-4 tw-space-y-3">
              {recentTape.length === 0 ? (
                <div className="tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-700 tw-bg-slate-950/60 tw-p-4 tw-text-sm tw-text-slate-400">
                  {copy.emptyState}
                </div>
              ) : (
                recentTape.map((point) => (
                  <div
                    key={`${point.crop}-${point.mandi}-${point.timestamp}`}
                    className="tw-flex tw-flex-col tw-gap-2 tw-rounded-2xl tw-border tw-border-slate-800 tw-bg-slate-950/60 tw-p-3 md:tw-flex-row md:tw-items-center md:tw-justify-between"
                  >
                    <div>
                      <p className="tw-font-semibold tw-text-slate-100">{point.crop}</p>
                      <p className="tw-text-xs tw-text-slate-400">
                        {point.mandi}
                        {point.state ? `, ${point.state}` : ""}
                      </p>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-4">
                      <span className="tw-text-sm tw-font-semibold tw-text-white">
                        {currencyFormatter.format(point.price)}
                      </span>
                      <span className="tw-text-xs tw-font-medium tw-text-slate-400">
                        {formatDateTime(point.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="tw-space-y-4">
          <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <h3 className="tw-font-semibold tw-text-white">{copy.currentPrice}</h3>
              <span
                className={`tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs tw-font-semibold ${statusBadgeClassName}`}
              >
                {transportMode === "websocket" ? copy.websocketLive : copy.pollingFallback}
              </span>
            </div>
            <div className="tw-mt-4 tw-space-y-4">
              <div>
                <p className="tw-text-4xl tw-font-semibold tw-text-white">
                  {summary ? currencyFormatter.format(summary.currentPrice) : "--"}
                </p>
                <p className={`tw-mt-2 tw-text-sm tw-font-semibold ${changeClassName}`}>
                  {summary ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "--"}
                </p>
              </div>
              <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <div className="tw-rounded-2xl tw-border tw-border-slate-800 tw-bg-slate-950/60 tw-p-3">
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.high}
                  </p>
                  <p className="tw-mt-2 tw-text-lg tw-font-semibold tw-text-white">
                    {summary ? compactFormatter.format(summary.highPrice) : "--"}
                  </p>
                </div>
                <div className="tw-rounded-2xl tw-border tw-border-slate-800 tw-bg-slate-950/60 tw-p-3">
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
                    {copy.low}
                  </p>
                  <p className="tw-mt-2 tw-text-lg tw-font-semibold tw-text-white">
                    {summary ? compactFormatter.format(summary.lowPrice) : "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <MandiTradingMoversPanel
            title={copy.gainers}
            tone="positive"
            items={snapshot?.gainers || []}
            emptyLabel={copy.noMovers}
            currentLabel={copy.current}
          />
          <MandiTradingMoversPanel
            title={copy.losers}
            tone="negative"
            items={snapshot?.losers || []}
            emptyLabel={copy.noMovers}
            currentLabel={copy.current}
          />
        </div>
      </div>
    </section>
  );
};

export default MandiTradingDashboard;
