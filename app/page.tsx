'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/src/lib/auth';
import {
  getDashboardKpis,
  getRevenueByBranch,
  getServiceDistribution,
  getBranchPerformance,
  getProfitabilityByService,
} from '@/src/lib/dashboardApi';
import type {
  DashboardKpisResponse,
  RevenueByBranchResponse,
  ServiceDistributionResponse,
  BranchPerformanceResponse,
  ProfitabilityByServiceResponse,
} from '@/src/lib/types/dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KpiCards from './components/dashboard/KpiCards';
import RevenueChart from './components/dashboard/RevenueChart';
import ServiceDistribution from './components/dashboard/ServiceDistribution';
import BranchPerformanceTable from './components/dashboard/BranchPerformanceTable';
import ProfitabilityGrid from './components/dashboard/ProfitabilityGrid';

export default function Home() {
  const router = useRouter();
  const [kpis, setKpis] = useState<DashboardKpisResponse | null>(null);
  const [revenue, setRevenue] = useState<RevenueByBranchResponse | null>(null);
  const [serviceDist, setServiceDist] =
    useState<ServiceDistributionResponse | null>(null);
  const [branchPerf, setBranchPerf] =
    useState<BranchPerformanceResponse | null>(null);
  const [profitability, setProfitability] =
    useState<ProfitabilityByServiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Último mes');

  useEffect(() => {
    if (!getAccessToken()) router.replace('/login');
  }, [router]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [k, r, s, b, p] = await Promise.all([
        getDashboardKpis(period),
        getRevenueByBranch(period),
        getServiceDistribution(),
        getBranchPerformance(),
        getProfitabilityByService(),
      ]);
      setKpis(k);
      setRevenue(r);
      setServiceDist(s);
      setBranchPerf(b);
      setProfitability(p);
    } catch (e) {
      console.error('Error al cargar el dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Ejecutivo
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Resumen de rendimiento de todas las sucursales
            </p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-none"
            aria-label="Período"
          >
            <option>Último mes</option>
            <option>Últimos 3 meses</option>
            <option>Último año</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {kpis && <KpiCards kpis={kpis.kpis} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {revenue && <RevenueChart data={revenue} />}
              {serviceDist && <ServiceDistribution data={serviceDist} />}
            </div>

            {branchPerf && (
              <BranchPerformanceTable data={branchPerf} />
            )}

            {profitability && (
              <ProfitabilityGrid data={profitability} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
