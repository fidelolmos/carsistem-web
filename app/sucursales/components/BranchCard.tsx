'use client';

import { Building2, MapPin, Phone, Mail } from 'lucide-react';
import type { Branch } from '@/src/lib/types/branch';

type BranchCardProps = {
  branch: Branch;
  accentColor?: 'blue' | 'purple' | 'green';
  onEdit?: () => void;
};

const accentColors = {
  blue: '#2563eb',
  purple: '#9333ea',
  green: '#22c55e',
};

export default function BranchCard({ branch, accentColor = 'blue', onEdit }: BranchCardProps) {
  const colorIndex = ['blue', 'purple', 'green'] as const;
  const currentIndex = colorIndex.indexOf(accentColor);
  const color = colorIndex[currentIndex % colorIndex.length];

  // Intentar obtener el color real del metadata
  let customColor: string | null = null;
  let manager = '';
  let street = '';
  let city = '';
  let state = '';
  let postalCode = '';
  let appointmentsPerMonth = 0;
  let monthlyIncome = 0;

  try {
    if (branch.metadata) {
      const metadata = JSON.parse(branch.metadata);
      if (metadata.primaryColor && typeof metadata.primaryColor === 'string') {
        customColor = metadata.primaryColor;
      } else if (metadata.color && typeof metadata.color === 'string') {
        customColor = metadata.color;
      }
      manager = metadata.manager || '';
      street = metadata.street || '';
      city = metadata.city || '';
      state = metadata.state || '';
      postalCode = metadata.postalCode || '';
      appointmentsPerMonth = metadata.appointmentsPerMonth || Math.floor(Math.random() * 200) + 300;
      monthlyIncome = metadata.monthlyIncome || Math.floor(Math.random() * 500000) + 800000;
    }
  } catch {
    // Si no se puede parsear, usar valores por defecto
    appointmentsPerMonth = Math.floor(Math.random() * 200) + 300;
    monthlyIncome = Math.floor(Math.random() * 500000) + 800000;
  }

  const topBarColor = customColor || accentColors[color];
  
  // Construir dirección completa
  const fullAddress = street && city && state && postalCode
    ? `${street} ${city}, ${state} ${postalCode}`
    : branch.address;

  // Formatear ingresos
  const formattedIncome = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(monthlyIncome);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-md">
      {/* Barra de color superior */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: topBarColor }}
      />
      
      <div className="p-6">
        {/* Header con icono, nombre y badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800"
              style={{ color: topBarColor }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="card-title">
                {branch.name}
              </h3>
            </div>
          </div>
          <span className="badge px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100">
            Activa
          </span>
        </div>

        {/* Información de contacto */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-gray-400 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
            <span className="body-text">{fullAddress}</span>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={16} className="text-gray-400 dark:text-zinc-400 flex-shrink-0" />
            <span className="body-text">{branch.phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-400 dark:text-zinc-400 flex-shrink-0" />
            <span className="body-text">{branch.email}</span>
          </div>
        </div>

        {/* Métricas: Gerente, Citas/mes, Ingresos */}
        <div className="space-y-2 mb-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">Gerente</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {manager || 'Sin asignar'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">Citas/mes</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {appointmentsPerMonth}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">Ingresos mensuales</span>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar
          </button>
          <button
            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
            aria-label="Eliminar sucursal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

