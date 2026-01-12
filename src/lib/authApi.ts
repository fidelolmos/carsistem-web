import { getRefreshToken, saveTokens, clearTokens } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  if (!refreshToken) throw new Error("No hay refresh_token");

  // Usar fetch directamente para evitar bucle infinito con apiFetch
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const details = await res
      .json()
      .catch(() => ({ message: "Error al refrescar sesión" }));
    throw new Error(details.message || "Refresh falló");
  }

  const data = (await res.json()) as ApiBase<RefreshData>;

  if (!data.ok) throw new Error(data.message || "Refresh falló");

  saveTokens({
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
  });

  return data.data;
}

export async function logoutSession() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      // Usar fetch directamente para evitar bucle infinito con apiFetch
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        const details = await res
          .json()
          .catch(() => ({ message: "Error al cerrar sesión" }));
        throw new Error(details.message || "Logout falló");
      }

      const data = (await res.json()) as ApiBase<null>;
      if (!data.ok) throw new Error(data.message || "Logout falló");
    }
  } finally {
    clearTokens();
  }
}
