import React, { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

import type { MandiTradingPoint } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface MandiTradingChartProps {
  points: MandiTradingPoint[];
  priceLabel: string;
  mandiLabel: string;
  stateLabel: string;
  emptyLabel: string;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const tickFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const MandiTradingChart: React.FC<MandiTradingChartProps> = ({
  points,
  priceLabel,
  mandiLabel,
  stateLabel,
  emptyLabel,
}) => {
  const chartData = useMemo<ChartData<"line", number[], string> | null>(() => {
    if (!points.length) return null;

    return {
      labels: points.map((point) => tickFormatter.format(new Date(point.timestamp))),
      datasets: [
        {
          label: priceLabel,
          data: points.map((point) => point.price),
          borderColor: "#34d399",
          backgroundColor: "rgba(52, 211, 153, 0.14)",
          fill: true,
          tension: 0.36,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHitRadius: 20,
          borderWidth: 2.5,
        },
      ],
    };
  }, [points, priceLabel]);

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 420,
        easing: "easeOutQuart",
      },
      normalized: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(2, 6, 23, 0.96)",
          borderColor: "rgba(52, 211, 153, 0.25)",
          borderWidth: 1,
          titleColor: "#e2e8f0",
          bodyColor: "#e2e8f0",
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) =>
              `${priceLabel}: ${currencyFormatter.format(Number(context.parsed.y || 0))}`,
            afterLabel: (context) => {
              const point = points[context.dataIndex];
              if (!point) return "";
              return [`${mandiLabel}: ${point.mandi}`, `${stateLabel}: ${point.state || "-"}`];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "rgba(203, 213, 225, 0.88)",
            maxRotation: 0,
            autoSkipPadding: 18,
          },
          grid: {
            color: "rgba(71, 85, 105, 0.18)",
          },
        },
        y: {
          ticks: {
            color: "rgba(203, 213, 225, 0.88)",
            callback: (value) => currencyFormatter.format(Number(value)),
          },
          grid: {
            color: "rgba(71, 85, 105, 0.18)",
          },
        },
      },
    }),
    [mandiLabel, points, priceLabel, stateLabel],
  );

  if (!chartData) {
    return (
      <div className="tw-flex tw-h-full tw-min-h-[320px] tw-items-center tw-justify-center tw-rounded-[24px] tw-border tw-border-dashed tw-border-slate-700 tw-bg-slate-950/40 tw-text-sm tw-text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return <Line data={chartData} options={chartOptions} />;
};

export default MandiTradingChart;
