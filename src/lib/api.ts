import { getAccessToken, clearTokens } from './auth';
import { refreshSession } from './authApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiError = {
  message: string;
  status?: number;
  details?: unknown;
};

async function parseErrorDetails(res: Response) {
  try {
    return await res.json();
  } catch {
    return await res.text().catch(() => null);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('accept', '*/*');

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    try {
      await refreshSession();
      return apiFetch<T>(path, options, false);
    } catch {
      // Si el refresh falla, el token expiró completamente
      // Limpiar tokens y redirigir al login
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      const err: ApiError = {
        message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        status: 401,
      };
      throw err;
    }
  }

  // Si recibimos 401 después de intentar refrescar (retry = false), también redirigir
  if (res.status === 401 && !retry) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    const err: ApiError = {
      message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
      status: 401,
    };
    throw err;
  }

  if (!res.ok) {
    const details = await parseErrorDetails(res);
    
    // Intentar extraer un mensaje más descriptivo del error
    let errorMessage = 'Error en la solicitud';
    
    if (details && typeof details === 'object') {
      const detailsObj = details as { message?: string; error?: string; [key: string]: unknown };
      if (detailsObj.message && typeof detailsObj.message === 'string') {
        errorMessage = detailsObj.message;
      } else if (detailsObj.error && typeof detailsObj.error === 'string') {
        errorMessage = detailsObj.error;
      }
    } else if (typeof details === 'string') {
      errorMessage = details;
    }
    
    const err: ApiError = {
      message: errorMessage,
      status: res.status,
      details,
    };
    
    console.error(`API Error ${res.status}:`, {
      message: errorMessage,
      details,
      url: `${API_URL}${path}`,
    });
    
    throw err;
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
