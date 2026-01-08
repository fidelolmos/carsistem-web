import { apiFetch } from './api';
import { getRefreshToken, saveTokens, clearTokens } from './auth';

type ApiBase<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type RefreshData = {
  access_token: string;
  refresh_token: string;
};

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No hay refresh_token');

  const res = await apiFetch<ApiBase<RefreshData>>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) throw new Error(res.message || 'Refresh falló');

  saveTokens({
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
  });

  return res.data;
}

export async function logoutSession() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      const res = await apiFetch<ApiBase<null>>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) throw new Error(res.message || 'Logout falló');
    }
  } finally {
    clearTokens();
  }
}
