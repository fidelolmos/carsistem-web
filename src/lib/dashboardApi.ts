/**
 * API del Dashboard Ejecutivo.
 *
 * IMPORTANTE: Por ahora todas las funciones devuelven datos mock (JSON estáticos).
 * Cuando existan los endpoints reales, reemplazar el return por:
 *
 *   return apiFetch<DashboardKpisResponse>('/dashboard/kpis?period=...');
 *
 * y eliminar los imports de los JSON mock.
 */

import type {
  DashboardKpisResponse,
  RevenueByBranchResponse,
  ServiceDistributionResponse,
  BranchPerformanceResponse,
  ProfitabilityByServiceResponse,
} from './types/dashboard';

// Datos ficticios que simulan las respuestas de los endpoints
import kpisData from './mock/dashboard/kpis.json';
import revenueData from './mock/dashboard/revenue-by-branch.json';
import serviceDistData from './mock/dashboard/service-distribution.json';
import branchPerfData from './mock/dashboard/branch-performance.json';
import profitabilityData from './mock/dashboard/profitability-by-service.json';

/** Simula un pequeño retraso de red (opcional, para pruebas de loading) */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET /api/dashboard/kpis (o similar)
 * KPIs: Citas del Mes, Tasa de Conversión, Ticket Promedio, etc.
 */
export async function getDashboardKpis(
  _period?: string
): Promise<DashboardKpisResponse> {
  // await delay(300);
  return kpisData as DashboardKpisResponse;
}

/**
 * GET /api/dashboard/revenue-by-branch (o similar)
 * Ingresos por sucursal por mes (para gráfico de líneas).
 */
export async function getRevenueByBranch(
  _period?: string
): Promise<RevenueByBranchResponse> {
  // await delay(200);
  return revenueData as RevenueByBranchResponse;
}

/**
 * GET /api/dashboard/service-distribution (o similar)
 * Distribución de servicios en % (para gráfico circular).
 */
export async function getServiceDistribution(): Promise<ServiceDistributionResponse> {
  // await delay(200);
  return serviceDistData as ServiceDistributionResponse;
}

/**
 * GET /api/dashboard/branch-performance (o similar)
 * Rendimiento por sucursal: citas, ingresos, margen, conversión (tabla).
 */
export async function getBranchPerformance(): Promise<BranchPerformanceResponse> {
  // await delay(200);
  return branchPerfData as BranchPerformanceResponse;
}

/**
 * GET /api/dashboard/profitability-by-service (o similar)
 * Mapa de rentabilidad: sucursal x tipo de servicio (grid).
 */
export async function getProfitabilityByService(): Promise<ProfitabilityByServiceResponse> {
  // await delay(200);
  return profitabilityData as ProfitabilityByServiceResponse;
}
