'use client';

import type { ServiceDistributionResponse } from '@/src/lib/types/dashboard';

const COLORS = ['#2563eb', '#9333ea', '#22c55e', '#f97316', '#6b7280'];

type ServiceDistributionProps = {
  data: ServiceDistributionResponse;
};

export default function ServiceDistribution({ data }: ServiceDistributionProps) {
  const { data: items } = data;
  const total = items.reduce((s, i) => s + i.percentage, 0) || 100;
  let from = 0;
  const conicParts = items.map((it, i) => {
    const to = from + (it.percentage / total) * 100;
    const part = `${COLORS[i % COLORS.length]} ${from}% ${to}%`;
    from = to;
    return part;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-5">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Distribución de Servicios
      </h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div
          className="w-36 h-36 rounded-full shrink-0"
          style={{
            background: `conic-gradient(${conicParts.join(', ')})`,
          }}
        />
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {it.name}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {it.percentage}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
