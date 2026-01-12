"use client";

import { Building2, MapPin, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import type { Branch } from "@/src/lib/types/branch";

type BranchCardProps = {
  branch: Branch;
  accentColor?: "blue" | "purple" | "green";
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  appointmentsCount?: number;
};

const accentColors = {
  blue: "#2563eb",
  purple: "#9333ea",
  green: "#22c55e",
};

export default function BranchCard({
  branch,
  accentColor = "blue",
  onEdit,
  onDelete,
  isDeleting = false,
  appointmentsCount = 0,
}: BranchCardProps) {
  const colorIndex = ["blue", "purple", "green"] as const;
  const currentIndex = colorIndex.indexOf(accentColor);
  const color = colorIndex[currentIndex % colorIndex.length];

  // Intentar obtener el color real del metadata
  let customColor: string | null = null;
  let manager = "";
  let street = "";
  let city = "";
  let state = "";
  let postalCode = "";
  let monthlyIncome = 0;

  try {
    if (branch.metadata) {
      const metadata = JSON.parse(branch.metadata);
      if (metadata.primaryColor && typeof metadata.primaryColor === "string") {
        customColor = metadata.primaryColor;
      } else if (metadata.color && typeof metadata.color === "string") {
        customColor = metadata.color;
      }
      manager = metadata.manager || "";
      street = metadata.street || "";
      city = metadata.city || "";
      state = metadata.state || "";
      postalCode = metadata.postalCode || "";
      monthlyIncome = metadata.monthlyIncome || 0;
    }
  } catch {
    // Si no se puede parsear, usar valores por defecto
    monthlyIncome = 0;
  }

  // Usar el conteo real de citas si está disponible, sino usar 0
  const appointmentsPerMonth = appointmentsCount;

  const topBarColor = customColor || accentColors[color];

  // Función helper para convertir hex a rgba con opacidad
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Construir dirección completa
  const fullAddress =
    street && city && state && postalCode
      ? `${street} ${city}, ${state} ${postalCode}`
      : branch.address;

  // Formatear ingresos
  const formattedIncome = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(monthlyIncome);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-md">
      {/* Barra de color superior */}
      <div className="h-1 w-full" style={{ backgroundColor: topBarColor }} />

      <div className="p-6">
        {/* Header con icono, nombre y badge */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: hexToRgba(topBarColor, 0.1),
                color: topBarColor,
              }}
            >
              <Building2 size={24} strokeWidth={2} />
            </div>
            <div>
              <h3 className="card-title">{branch.name}</h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs font-medium">
            Activa
          </span>
        </div>

        {/* Información de contacto */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <MapPin
              size={16}
              strokeWidth={2}
              className="text-gray-400 dark:text-zinc-400 mt-0.5 flex-shrink-0"
            />
            <span className="body-text leading-relaxed">{fullAddress}</span>
          </div>

          <div className="flex items-center gap-3">
            <Phone
              size={16}
              strokeWidth={2}
              className="text-gray-400 dark:text-zinc-400 flex-shrink-0"
            />
            <span className="body-text">{branch.phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <Mail
              size={16}
              strokeWidth={2}
              className="text-gray-400 dark:text-zinc-400 flex-shrink-0"
            />
            <span className="body-text">{branch.email}</span>
          </div>
        </div>

        {/* Métricas: Gerente, Citas/mes, Ingresos */}
        <div className="space-y-2 mb-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              Gerente
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {manager || "Sin asignar"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              Citas/mes
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {appointmentsPerMonth}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              Ingresos mensuales
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formattedIncome}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={onEdit}
            className="body-text px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
            aria-label="Editar sucursal"
          >
            <Pencil size={16} strokeWidth={2} />
            Editar
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Eliminar sucursal"
          >
            {isDeleting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Trash2 size={16} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
