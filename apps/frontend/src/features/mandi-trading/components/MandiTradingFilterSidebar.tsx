import React from "react";

import type { MandiTradingFilters } from "../types";

interface MandiTradingFilterSidebarProps {
  filters: MandiTradingFilters;
  cropOptions: string[];
  stateOptions: string[];
  mandiOptions: string[];
  onFilterChange: (key: "crop" | "state" | "mandi", value: string) => void;
  labels: {
    title: string;
    crop: string;
    state: string;
    mandi: string;
    connection: string;
    dataSource: string;
    lastSync: string;
  };
  transportLabel: string;
  sourceLabel: string;
  updatedAtLabel: string;
}

const baseFieldClassName =
  "tw-w-full tw-rounded-2xl tw-border tw-border-slate-700 tw-bg-slate-900/80 tw-px-4 tw-py-3 tw-text-sm tw-text-slate-100 focus:tw-border-emerald-400 focus:tw-outline-none";

const labelClassName =
  "tw-mb-2 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400";

const MandiTradingFilterSidebar: React.FC<MandiTradingFilterSidebarProps> = ({
  filters,
  cropOptions,
  stateOptions,
  mandiOptions,
  onFilterChange,
  labels,
  transportLabel,
  sourceLabel,
  updatedAtLabel,
}) => (
  <aside className="tw-space-y-4">
    <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
      <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.28em] tw-text-emerald-300">
        {labels.title}
      </p>
      <div className="tw-mt-4 tw-space-y-4">
        <label className="tw-block">
          <span className={labelClassName}>{labels.crop}</span>
          <select
            className={baseFieldClassName}
            value={filters.crop}
            onChange={(event) => onFilterChange("crop", event.target.value)}
          >
            {cropOptions.map((option) => (
              <option key={option} value={option} className="tw-bg-slate-950">
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="tw-block">
          <span className={labelClassName}>{labels.state}</span>
          <select
            className={baseFieldClassName}
            value={filters.state}
            onChange={(event) => onFilterChange("state", event.target.value)}
          >
            {stateOptions.map((option) => (
              <option key={option} value={option} className="tw-bg-slate-950">
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="tw-block">
          <span className={labelClassName}>{labels.mandi}</span>
          <select
            className={baseFieldClassName}
            value={filters.mandi}
            onChange={(event) => onFilterChange("mandi", event.target.value)}
          >
            {mandiOptions.map((option) => (
              <option key={option} value={option} className="tw-bg-slate-950">
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>

    <div className="tw-rounded-[26px] tw-border tw-border-slate-800 tw-bg-slate-900/85 tw-p-4 tw-shadow-lg">
      <div className="tw-space-y-3">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
            {labels.connection}
          </span>
          <span className="tw-rounded-full tw-border tw-border-emerald-500/30 tw-bg-emerald-500/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-emerald-300">
            {transportLabel}
          </span>
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
            {labels.dataSource}
          </span>
          <span className="tw-text-sm tw-font-semibold tw-text-slate-100">{sourceLabel}</span>
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-400">
            {labels.lastSync}
          </span>
          <span className="tw-text-sm tw-font-semibold tw-text-slate-100">{updatedAtLabel}</span>
        </div>
      </div>
    </div>
  </aside>
);

export default MandiTradingFilterSidebar;
