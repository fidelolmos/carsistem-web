'use client';

import type { ProfitabilityByServiceResponse } from '@/src/lib/types/dashboard';

type ProfitabilityGridProps = {
  data: ProfitabilityByServiceResponse;
};

function getCell(
  data: ProfitabilityByServiceResponse['data'],
  branchId: string,
  serviceId: string
): number | undefined {
  return data.find(
    (d) => d.branchId === branchId && d.serviceId === serviceId
  )?.percentage;
}

export default function ProfitabilityGrid({ data }: ProfitabilityGridProps) {
  const { branches, services, data: cells } = data;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Mapa de Rentabilidad por Servicio
        </h3>
      </div>
      <div className="p-5">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `minmax(0, 1fr) repeat(${services.length}, minmax(0, 1fr))`,
          }}
        >
          <div />
          {services.map((s) => (
            <div
              key={s.id}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center"
            >
              {s.name}
            </div>
          ))}
          {branches.map((b) => (
            <div key={b.id} className="contents">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                {b.name}
              </div>
              {services.map((s) => {
                const pct = getCell(cells, b.id, s.id);
                return (
                  <div key={`${b.id}-${s.id}`} className="flex justify-center">
                    <span className="inline-flex items-center justify-center min-w-[4rem] px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                      {pct != null ? `${pct}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
