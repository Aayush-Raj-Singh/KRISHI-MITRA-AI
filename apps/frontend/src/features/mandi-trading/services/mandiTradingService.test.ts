import { describe, expect, it } from "vitest";

import {
  aggregateMoversFromMarketRows,
  buildTradingSummary,
  mergeRealtimeTick,
  normalizeMandiHistory,
  parseRealtimeMandiEvent,
} from "./mandiTradingService";

describe("mandiTradingService", () => {
  it("normalizes price history into trading points", () => {
    const points = normalizeMandiHistory(
      {
        crop: "Wheat",
        market: "Patna",
        source: "agmarknet",
        prices: [
          { date: "2026-04-01", price: 2280 },
          { date: "2026-04-02", price: 2325 },
        ],
        fetched_at: "2026-04-02T05:00:00.000Z",
        cached: false,
      },
      "Bihar",
    );

    expect(points).toEqual([
      {
        crop: "Wheat",
        mandi: "Patna",
        state: "Bihar",
        price: 2280,
        timestamp: "2026-04-01T00:00:00.000Z",
      },
      {
        crop: "Wheat",
        mandi: "Patna",
        state: "Bihar",
        price: 2325,
        timestamp: "2026-04-02T00:00:00.000Z",
      },
    ]);

    expect(buildTradingSummary(points)?.changePct).toBeCloseTo(1.9736, 3);
  });

  it("aggregates top gainers and losers by crop and mandi scope", () => {
    const { gainers, losers } = aggregateMoversFromMarketRows(
      [
        {
          commodity: "Wheat",
          market: "Patna",
          district: "Patna",
          date: "2026-04-01",
          variety: "FAQ",
          price: 2250,
          min_price: 2200,
          max_price: 2300,
        },
        {
          commodity: "Wheat",
          market: "Patna",
          district: "Patna",
          date: "2026-04-02",
          variety: "FAQ",
          price: 2340,
          min_price: 2280,
          max_price: 2360,
        },
        {
          commodity: "Onion",
          market: "Patna",
          district: "Patna",
          date: "2026-04-01",
          variety: "Red",
          price: 1760,
          min_price: 1700,
          max_price: 1800,
        },
        {
          commodity: "Onion",
          market: "Patna",
          district: "Patna",
          date: "2026-04-02",
          variety: "Red",
          price: 1600,
          min_price: 1560,
          max_price: 1680,
        },
      ],
      { state: "Bihar", mandi: "Patna" },
    );

    expect(gainers[0]?.crop).toBe("Wheat");
    expect(gainers[0]?.changePct).toBeGreaterThan(0);
    expect(losers[0]?.crop).toBe("Onion");
    expect(losers[0]?.changePct).toBeLessThan(0);
  });

  it("parses and merges realtime mandi ticks", () => {
    const tick = parseRealtimeMandiEvent({
      event: "market.price.updated",
      crop: "Rice",
      mandi: "Patna",
      state: "Bihar",
      price: 2155,
      timestamp: "2026-04-02T09:10:00.000Z",
    });

    expect(tick).not.toBeNull();

    const merged = mergeRealtimeTick(
      [
        {
          crop: "Rice",
          mandi: "Patna",
          state: "Bihar",
          price: 2130,
          timestamp: "2026-04-02T08:00:00.000Z",
        },
      ],
      tick!,
      1,
    );

    expect(merged).toHaveLength(2);
    expect(merged[1]?.price).toBe(2155);
  });
});
