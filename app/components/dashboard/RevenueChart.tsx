'use client';

import type { RevenueByBranchResponse } from '@/src/lib/types/dashboard';

const COLORS = {
  centro: '#2563eb',
  norte: '#9333ea',
  sur: '#22c55e',
};

type RevenueChartProps = {
  data: RevenueByBranchResponse;
};

export default function RevenueChart({ data }: RevenueChartProps) {
  const { data: points, labels } = data;
  const keys = ['centro', 'norte', 'sur'] as const;
  const maxVal = Math.max(
    ...points.flatMap((p) => [p.centro, p.norte, p.sur])
  );
  const minVal = Math.min(
    ...points.flatMap((p) => [p.centro, p.norte, p.sur])
  );
  const range = maxVal - minVal || 1;
  const w = 480;
  const h = 220;
  const padding = { top: 16, right: 16, bottom: 32, left: 56 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const toX = (i: number) =>
    padding.left + (i / Math.max(points.length - 1, 1)) * chartW;
  const toY = (v: number) =>
    padding.top + chartH - ((v - minVal) / range) * chartH;

  const paths = keys.map((key) => {
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p[key])}`)
      .join(' ');
    return { key, label: labels[key], color: COLORS[key], d };
  });

  const formatY = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(v);
  };

  const yTicks = [minVal, minVal + range * 0.5, maxVal].map((v) =>
    Math.round(v / 50000) * 50000
  );
  const uniqYTicks = [...new Set(yTicks)];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-5">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Ingresos por Sucursal
      </h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="min-w-[400px] w-full h-[220px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Eje Y */}
          {uniqYTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={toY(v)}
                x2={w - padding.right}
                y2={toY(v)}
                stroke="currentColor"
                strokeDasharray="4 2"
                className="text-gray-200 dark:text-zinc-700"
              />
              <text
                x={padding.left - 8}
                y={toY(v)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-500 dark:fill-gray-400"
              >
                {formatY(v)}
              </text>
            </g>
          ))}
          {/* Líneas */}
          {paths.map(({ key, label, color, d }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* Eje X - meses */}
          {points.map((p, i) => (
            <text
              key={i}
              x={toX(i)}
              y={h - 8}
              textAnchor="middle"
              className="text-[10px] fill-gray-500 dark:fill-gray-400"
            >
              {p.month}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800">
        {paths.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
