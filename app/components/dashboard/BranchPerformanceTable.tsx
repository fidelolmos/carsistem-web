'use client';

import type { BranchPerformanceResponse } from '@/src/lib/types/dashboard';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

type BranchPerformanceTableProps = {
  data: BranchPerformanceResponse;
};

export default function BranchPerformanceTable({
  data,
}: BranchPerformanceTableProps) {
  const { data: rows } = data;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Rendimiento por Sucursal
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-800/50">
              <th className="text-left py-3 px-5 font-medium text-gray-600 dark:text-gray-400">
                Sucursal
              </th>
              <th className="text-right py-3 px-5 font-medium text-gray-600 dark:text-gray-400">
                Citas
              </th>
              <th className="text-right py-3 px-5 font-medium text-gray-600 dark:text-gray-400">
                Ingresos
              </th>
              <th className="text-right py-3 px-5 font-medium text-gray-600 dark:text-gray-400">
                Margen
              </th>
              <th className="text-right py-3 px-5 font-medium text-gray-600 dark:text-gray-400">
                Conversión
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.branchId}
                className="border-t border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/30"
              >
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                      aria-hidden
                    >
                      {row.branchCode}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {row.branchName}
                    </span>
                  </div>
                </td>
                <td className="text-right py-3 px-5 text-gray-700 dark:text-gray-300">
                  {row.appointments.toLocaleString('es-MX')}
                </td>
                <td className="text-right py-3 px-5 font-medium text-gray-900 dark:text-white">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="text-right py-3 px-5 text-gray-700 dark:text-gray-300">
                  {row.margin}%
                </td>
                <td className="text-right py-3 px-5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200">
                    {row.conversion}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
