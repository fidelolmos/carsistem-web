'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import { logoutSession } from '@/src/lib/authApi';

type Branch = {
  id: string;
  name: string;
};

const branches: Branch[] = [
  { id: 'all', name: 'Todas las sucursales' },
  { id: 'centro', name: 'Carsistem Centro' },
  { id: 'norte', name: 'Carsistem Norte' },
  { id: 'sur', name: 'Carsistem Sur' },
];

export default function Header() {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branches[3]); // Carsistem Sur por defecto
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutSession();
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Logo y Dropdown de Sucursal - Esquina izquierda */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="block dark:hidden">
              <Image
                src="/backoffice-light.png"
                alt="Carsistem"
                width={220}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="hidden dark:block">
              <Image
                src="/backoffice-dark.png"
                alt="Carsistem"
                width={220}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          {/* Dropdown de Sucursal */}
          <div className="relative" ref={branchDropdownRef}>
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-600 dark:text-gray-400">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedBranch.name}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className={`text-gray-500 dark:text-gray-400 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showBranchDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-zinc-700">
                  Seleccionar Sucursal
                </div>
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranch(branch);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors ${
                      selectedBranch.id === branch.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {branch.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controles del Header - Esquina derecha */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notificaciones */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Notificaciones"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600 dark:text-gray-400">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full notification-badge"></span>
          </button>

          {/* Refresh */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Actualizar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600 dark:text-gray-400">
              <path
                d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 3v5h-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 16H3v5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Dropdown de Usuario */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                AM
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Admin</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className={`text-gray-500 dark:text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showUserDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden user-menu-dropdown">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border-b border-gray-200 dark:border-zinc-700">
                  Mi Cuenta
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border-b border-gray-200 dark:border-zinc-700">
                  Perfil
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border-b border-gray-200 dark:border-zinc-700">
                  Configuración
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600 dark:text-gray-400">
                    <path
                      d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Cambiar de Portal
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-600 dark:text-red-400">
                    <path
                      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17l5-5-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

