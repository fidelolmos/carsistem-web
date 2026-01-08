'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/src/lib/auth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />
      <Header />
      {/* Main Content Area */}
      <main className="ml-60 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Ejecutivo</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Resumen de rendimiento de todas las sucursales
          </p>
        </div>
        {/* Aquí irá el contenido del dashboard */}
      </main>
    </div>
  );
}
