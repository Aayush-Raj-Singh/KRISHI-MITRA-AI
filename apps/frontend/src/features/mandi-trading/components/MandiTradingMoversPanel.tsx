import React from "react";

import type { MandiMover } from "../types";

interface MandiTradingMoversPanelProps {
  title: string;
  tone: "positive" | "negative";
  items: MandiMover[];
  emptyLabel: string;
  currentLabel: string;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const MandiTradingMoversPanel: React.FC<MandiTradingMoversPanelProps> = ({
  title,
  tone,
  items,
  emptyLabel,
  currentLabel,
}) => {
  const accentClassName = tone === "positive" ? "tw-text-emerald-300" : "tw-text-rose-300";
  const badgeClassName =
    tone === "positive"
      ? "tw-border-emerald-500/30 tw-bg-emerald-500/10 tw-text-emerald-300"
      : "tw-border-rose-500/30 tw-bg-rose-500/10 tw-text-rose-300";

  return (
    <section className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-font-semibold tw-text-slate-100">{title}</h3>
        <span
          className={`tw-rounded-full tw-border tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${badgeClassName}`}
        >
          {items.length}
        </span>
      </div>

      <div className="tw-mt-4 tw-space-y-3">
        {items.length === 0 ? (
          <div className="tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-700 tw-bg-slate-950/60 tw-p-4 tw-text-sm tw-text-slate-400">
            {emptyLabel}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.crop}-${item.mandi}-${item.timestamp}`}
              className="tw-rounded-2xl tw-border tw-border-slate-800 tw-bg-slate-950/60 tw-p-3"
            >
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                <div className="tw-min-w-0">
                  <p className="tw-truncate tw-font-semibold tw-text-slate-100">{item.crop}</p>
                  <p className="tw-mt-1 tw-text-xs tw-text-slate-400">
                    {item.mandi}
                    {item.state ? `, ${item.state}` : ""}
                  </p>
                </div>
                <div className={`tw-text-right tw-text-sm tw-font-semibold ${accentClassName}`}>
                  {item.changePct >= 0 ? "+" : ""}
                  {item.changePct.toFixed(2)}%
                </div>
              </div>
              <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
                <span className="tw-text-xs tw-text-slate-400">{currentLabel}</span>
                <span className="tw-text-sm tw-font-semibold tw-text-slate-100">
                  {currencyFormatter.format(item.currentPrice)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default MandiTradingMoversPanel;
