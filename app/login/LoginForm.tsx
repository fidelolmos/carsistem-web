'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/src/lib/api';
import { saveTokens } from '@/src/lib/auth';

type LoginResponse = {
  ok: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      branch_id: string;
    };
  };
};

type ApiError = {
  message: string;
  status?: number;
  details?: {
    message?: string;
    [key: string]: unknown;
  };
};

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const message = error.details?.message || error.message;
    // Asegurar que message sea string antes de usar toLowerCase
    const messageStr = typeof message === 'string' ? message : String(message || '');
    const lowerMessage = messageStr.toLowerCase();
    
    // Traducir mensajes comunes de error del API
    if (lowerMessage.includes('incorrect') || lowerMessage.includes('invalid')) {
      return 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.';
    }
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
      return 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Error de conexión. Por favor, verifica tu conexión a internet.';
    }
    // Traducir validaciones de contraseña que no deberían estar en login
    if (lowerMessage.includes('password') && (lowerMessage.includes('longer') || lowerMessage.includes('8') || lowerMessage.includes('character'))) {
      // Esta validación debería estar solo en registro, pero si viene del backend, la traducimos
      // y tratamos como error de credenciales incorrectas
      return 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.';
    }
    return messageStr || 'Error desconocido. Por favor, intenta nuevamente.';
  }
  if (error instanceof Error) {
    const message = error.message;
    const lowerMessage = message.toLowerCase();
    // Traducir mensajes comunes de error
    if (lowerMessage.includes('incorrect') || lowerMessage.includes('invalid')) {
      return 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Error de conexión. Por favor, verifica tu conexión a internet.';
    }
    // Traducir validaciones de contraseña que no deberían estar en login
    if (lowerMessage.includes('password') && (lowerMessage.includes('longer') || lowerMessage.includes('8') || lowerMessage.includes('character'))) {
      return 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.';
    }
    return message;
  }
  return 'No se pudo iniciar sesión. Por favor, intenta nuevamente.';
}

function InputWithIcon(props: React.InputHTMLAttributes<HTMLInputElement> & { 
  label: string; 
  leftIcon: React.ReactNode; 
  rightIcon?: React.ReactNode;
  error?: string;
}) {
  const { label, leftIcon, rightIcon, error, ...inputProps } = props;
  const hasError = !!error;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">{label}</label>
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${hasError ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-zinc-400'}`}>
          {leftIcon}
        </div>
        <input
          {...inputProps}
          className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-10 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
            hasError
              ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
              : 'border-gray-100 dark:border-zinc-700 focus:border-purple-300 dark:focus:border-purple-500 focus:ring-purple-100 dark:focus:ring-purple-900/30'
          }`}
        />
        {rightIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        ) : null}
      </div>
      {hasError && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Limpiar errores cuando el usuario empiece a escribir
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: undefined }));
    }
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }
    if (error) setError(null);
  };

  // Validar campos antes de enviar
  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;

    // Validar email requerido
    if (!email || email.trim() === '') {
      errors.email = 'El usuario es requerido';
      isValid = false;
    } else {
      // Validar formato de email
      const emailTrimmed = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        errors.email = 'Por favor, ingresa un correo electrónico válido';
        isValid = false;
      }
    }

    // Validar contraseña requerida
    if (!password || password.trim() === '') {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validar campos requeridos
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error(res.message || 'Inicio de sesión inválido');

      saveTokens({
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
      });

      // (Opcional) si "remember" es false, podrías guardarlo en sessionStorage en vez de localStorage.
      // Por ahora lo dejamos igual para avanzar.

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <InputWithIcon
        label="Usuario o Correo Electrónico"
        type="email"
        placeholder="usuario@ejemplo.com"
        value={email}
        onChange={handleEmailChange}
        error={fieldErrors.email}
        title="Ingrese su correo electrónico"
        leftIcon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 21a8 8 0 1 0-16 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        }
      />

      <InputWithIcon
        label="Contraseña"
        type={showPass ? 'text' : 'password'}
        placeholder="********"
        value={password}
        onChange={handlePasswordChange}
        error={fieldErrors.password}
        title="Ingrese su contraseña"
        leftIcon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 11V8a5 5 0 0 1 10 0v3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        }
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {/* ojo */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-200">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:checked:bg-purple-600 dark:checked:border-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Recordarme
        </label>

        {/* Quitamos "¿Olvidaste tu contraseña?" como pediste */}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {/* escudo */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 20 6v7c0 5-3.5 9-8 9s-8-4-8-9V6l8-4Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9.5 12.5 11 14l3.5-4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
