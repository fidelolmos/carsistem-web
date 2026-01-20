'use client';

import type { DashboardKpi } from '@/src/lib/types/dashboard';
import { TrendingUp, TrendingDown } from 'lucide-react';

type KpiCardsProps = {
  kpis: DashboardKpi[];
};

export default function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const isPositive = kpi.change >= 0;
        const isGood = isPositive === kpi.positiveIsGood;
        const changeStr =
          kpi.change >= 0
            ? `+${kpi.change}${kpi.changeLabel ?? ''}`
            : `${kpi.change}${kpi.changeLabel ?? ''}`;

        return (
          <div
            key={kpi.id}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-4"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {kpi.label}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {typeof kpi.value === 'number'
                ? kpi.value.toLocaleString('es-MX')
                : kpi.value}
            </p>
            <div
              className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp size={14} strokeWidth={2} />
              ) : (
                <TrendingDown size={14} strokeWidth={2} />
              )}
              <span>{changeStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
