import { getAccessToken } from './auth';
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
    }
  }

  if (!res.ok) {
    const details = await parseErrorDetails(res);
    const err: ApiError = {
      message: 'Error en la solicitud',
      status: res.status,
      details,
    };
    throw err;
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
