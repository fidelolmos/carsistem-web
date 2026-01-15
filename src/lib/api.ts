import { getAccessToken, clearTokens } from "./auth";
import { refreshSession } from "./authApi";

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
  retry = true
): Promise<T> {
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("accept", "*/*");

  if (token) headers.set("Authorization", `Bearer ${token}`);

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
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      const err: ApiError = {
        message: "Sesión expirada. Por favor, inicia sesión nuevamente.",
        status: 401,
      };
      throw err;
    }
  }

  // Si recibimos 401 después de intentar refrescar (retry = false), también redirigir
  if (res.status === 401 && !retry) {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    const err: ApiError = {
      message: "Sesión expirada. Por favor, inicia sesión nuevamente.",
      status: 401,
    };
    throw err;
  }

  if (!res.ok) {
    const details = await parseErrorDetails(res);

    // Intentar extraer un mensaje más descriptivo del error
    let errorMessage = "Error en la solicitud";

    if (details && typeof details === "object") {
      const detailsObj = details as {
        message?: string;
        error?: string;
        errors?: unknown;
        [key: string]: unknown;
      };

      // Priorizar mensaje específico
      if (detailsObj.message && typeof detailsObj.message === "string") {
        errorMessage = detailsObj.message;
      } else if (detailsObj.error && typeof detailsObj.error === "string") {
        errorMessage = detailsObj.error;
      } else if (detailsObj.errors) {
        // Si hay errores de validación, intentar extraerlos
        if (Array.isArray(detailsObj.errors) && detailsObj.errors.length > 0) {
          const errorStrings = detailsObj.errors
            .filter((e: unknown) => typeof e === "string")
            .map((e: unknown) => String(e));
          if (errorStrings.length > 0) {
            errorMessage = errorStrings.join(", ");
          }
        } else if (typeof detailsObj.errors === "object") {
          // Errores por campo
          const fieldErrors = Object.entries(
            detailsObj.errors as Record<string, unknown>
          ).map(([field, err]) => {
            if (typeof err === "string") return `${field}: ${err}`;
            if (Array.isArray(err) && err.length > 0) {
              return `${field}: ${err[0]}`;
            }
            return `${field}: Error de validación`;
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(", ");
          }
        }
      }
    } else if (typeof details === "string" && details.trim()) {
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
      method: options.method || "GET",
    });

    throw err;
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
