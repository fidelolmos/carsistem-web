'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Cargar preferencia de tema al montar
  useEffect(() => {
    // Verificar si hay un tema guardado
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    
    // Si hay un tema guardado, usarlo
    if (savedTheme === 'dark') {
      html.classList.add('dark');
      requestAnimationFrame(() => {
        setIsDarkMode(true);
        setMounted(true);
      });
    } else if (savedTheme === 'light') {
      html.classList.remove('dark');
      requestAnimationFrame(() => {
        setIsDarkMode(false);
        setMounted(true);
      });
    } else {
      // Si no hay tema guardado, verificar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        requestAnimationFrame(() => {
          setIsDarkMode(true);
          setMounted(true);
        });
      } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        requestAnimationFrame(() => {
          setIsDarkMode(false);
          setMounted(true);
        });
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const html = document.documentElement;
    if (newDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
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
                   text-gray-700 dark:text-zinc-200"
        aria-label="Cambiar tema"
        disabled
      >
        ☾
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
                 text-gray-700 dark:text-zinc-200"
      aria-label="Cambiar tema"
      title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDarkMode ? "☀︎" : "☾"}
    </button>
  );
}