'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Building2,
  Calendar,
  Users,
  FileText,
  Settings,
  UserCircle,
} from 'lucide-react';

type MenuItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutGrid },
  { name: 'Sucursales', href: '/sucursales', icon: Building2 },
  { name: 'Agendar Citas', href: '/agendar-citas', icon: Calendar },
  { name: 'Usuarios y Roles', href: '/usuarios-y-roles', icon: Users },
  { name: 'Clientes y Vehículos', href: '/clientes', icon: UserCircle },
  { name: 'Reportes', href: '/reportes', icon: FileText },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-colors duration-300 z-40">
      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto pt-20 pb-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Para Dashboard, verificar si pathname es exactamente '/' o está vacío
            // Para Clientes, también verificar si empieza con /clientes
            const isActive = item.href === '/' 
              ? pathname === '/' || pathname === ''
              : item.href === '/clientes'
              ? pathname === '/clientes' || pathname.startsWith('/clientes/')
              : pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.9}
                    className={isActive ? 'text-white opacity-90' : 'text-gray-500 opacity-90'}
                  />
                  <span className={isActive ? 'sidebar-item-active' : 'sidebar-item'}>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

