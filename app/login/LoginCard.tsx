'use client';

import LoginForm from './LoginForm';
import ThemeLogo from '../components/ThemeLogo';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginCard() {
  return (
    <section className="w-full max-w-md">
      <div
        className="
          rounded-2xl
          bg-white dark:bg-zinc-900
          shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-none
          border border-gray-100 dark:border-zinc-800
          px-8 py-8
        "
      >
        {/* Toggle arriba a la derecha */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {/* Logo por tema */}
        <div className="mt-2 mb-4">
          <ThemeLogo />
        </div>

        <p className="mt-0 mb-6 text-center text-sm text-gray-500 dark:text-zinc-400">
          Ingresa tus credenciales para acceder
        </p>

        <div>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-300">
          ¿Necesitas ayuda?{' '}
          <a
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            href="#"
          >
            Contacta con soporte
          </a>
        </p>
      </div>
    </section>
  );
}
