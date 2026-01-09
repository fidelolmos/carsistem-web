const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

export function saveTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

// Obtener user_id del token JWT
export function getUserIdFromToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const token = getAccessToken();
    if (!token) return null;

    // Decodificar el payload del JWT (sin verificar la firma)
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    // El user_id puede estar en 'sub', 'id', o 'user_id' dependiendo del backend
    return payload.sub || payload.id || payload.user_id || null;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
