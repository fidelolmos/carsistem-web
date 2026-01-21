/**
 * Tipos para el Dashboard Ejecutivo.
 * Estos tipos reflejan la estructura que se espera de los endpoints reales.
 * Por ahora se consumen desde datos mock.
 */

/** Un indicador KPI del dashboard (citas, conversión, ticket, etc.) */
export type DashboardKpi = {
  id: string;
  label: string;
  value: string | number;
  change: number; // porcentaje o unidad según el KPI
  changeLabel?: string; // ej. "%" o "días"
  positiveIsGood: boolean; // si el aumento se considera positivo (ej. ingresos sí, tiempo ciclo no)
};

/** Respuesta mock/API: KPIs del dashboard */
export type DashboardKpisResponse = {
  period: string; // ej. "Último mes"
  kpis: DashboardKpi[];
};

/** Punto de la serie de ingresos por mes */
export type RevenueDataPoint = {
  month: string;
  centro: number;
  norte: number;
  sur: number;
};

/** Respuesta mock/API: Ingresos por sucursal (para gráfico de líneas) */
export type RevenueByBranchResponse = {
  branchIds: { centro: string; norte: string; sur: string };
  labels: { centro: string; norte: string; sur: string };
  data: RevenueDataPoint[];
};

/** Porcentaje de un tipo de servicio en la distribución */
export type ServiceDistributionItem = {
  id: string;
  name: string;
  percentage: number;
  color?: string; // opcional para consistencia visual
};

/** Respuesta mock/API: Distribución de servicios (para gráfico circular) */
export type ServiceDistributionResponse = {
  data: ServiceDistributionItem[];
};

/** Fila de rendimiento por sucursal */
export type BranchPerformanceRow = {
  branchId: string;
  branchName: string;
  branchCode: string; // "C", "N", "S" para avatar
  appointments: number;
  revenue: number;
  margin: number; // porcentaje
  conversion: number; // porcentaje
};

/** Respuesta mock/API: Rendimiento por sucursal (tabla) */
export type BranchPerformanceResponse = {
  data: BranchPerformanceRow[];
};

/** Celda del mapa de rentabilidad: sucursal x tipo de servicio */
export type ProfitabilityCell = {
  branchId: string;
  branchName: string;
  serviceId: string;
  serviceName: string;
  percentage: number;
};

/** Respuesta mock/API: Mapa de rentabilidad por servicio (grid) */
export type ProfitabilityByServiceResponse = {
  branches: { id: string; name: string }[];
  services: { id: string; name: string }[];
  data: { branchId: string; serviceId: string; percentage: number }[];
};
