'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sincronizar estado del botón con el tema (el script en layout ya aplicó el tema antes del paint)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');

    // Por si el script no corrió, aplicar tema
    if (savedTheme === 'dark' && !isDark) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else if (savedTheme === 'light' && isDark) {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }

    requestAnimationFrame(() => {
      setIsDarkMode(isDark);
      setMounted(true);
    });
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const html = document.documentElement;
    if (newDarkMode) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <button
        className="rounded-xl border px-3 py-2 text-xs
                   bg-white/70 hover:bg-white
                   dark:bg-zinc-900/70 dark:hover:bg-zinc-900
                   border-gray-200 dark:border-zinc-700
                   text-gray-700 dark:text-zinc-200
                   flex items-center justify-center"
        aria-label="Cambiar tema"
        disabled
      >
        <Moon size={16} strokeWidth={1.9} className="opacity-90" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="rounded-xl border px-3 py-2 text-xs
                 bg-white/70 hover:bg-white
                 dark:bg-zinc-900/70 dark:hover:bg-zinc-900
                 border-gray-200 dark:border-zinc-700
                 text-gray-700 dark:text-zinc-200
                 flex items-center justify-center"
      aria-label="Cambiar tema"
      title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDarkMode ? (
        <Sun size={16} strokeWidth={1.9} className="opacity-90" />
      ) : (
        <Moon size={16} strokeWidth={1.9} className="opacity-90" />
      )}
    </button>
  );
}