"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { clearTokens } from "@/src/lib/auth";
import ThemeLogo from "@/app/components/ThemeLogo";
import ThemeToggle from "@/app/components/ThemeToggle";
import Link from "next/link";

type VerifyResponse = {
  ok: boolean;
  message: string;
  data?: unknown;
  // El backend podría devolver tokens, pero no los vamos a usar
  access_token?: string;
  refresh_token?: string;
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "needs-password" | "success" | "error"
  >("needs-password");
  const [message, setMessage] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado en la URL.");
      return;
    }

    // Limpiar cualquier token existente al cargar la página de verificación
    // Por seguridad, no queremos que haya tokens activos durante la verificación
    clearTokens();

    // Si hay token, mostrar directamente el formulario de contraseña
    // El endpoint POST /auth/verify/confirm requiere token y password
    setStatus("needs-password");
    setMessage(
      "Por favor, establece una contraseña para completar la verificación de tu correo electrónico."
    );
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // Validar contraseñas
    if (!password || password.trim() === "") {
      setPasswordError("La contraseña es requerida");
      return;
    }

    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      setPasswordError("Token no válido");
      return;
    }

    try {
      setSubmitting(true);
      setPasswordError(null);

      const response = await apiFetch<VerifyResponse>(
        "/auth/verify/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            token: token,
            password: password,
          }),
        }
      );

      if (response.ok) {
        // Limpiar cualquier token que pueda existir (por seguridad)
        // No queremos iniciar sesión automáticamente después de verificar
        clearTokens();
        
        setStatus("success");
        setMessage(
          response.message ||
            "¡Tu correo electrónico ha sido verificado y tu contraseña ha sido establecida exitosamente! Ahora puedes iniciar sesión con tu correo y contraseña."
        );
      } else {
        setPasswordError(
          response.message || "Error al establecer la contraseña"
        );
      }
    } catch (err: unknown) {
      console.error("Error al establecer contraseña:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Error al establecer la contraseña. Por favor, intenta nuevamente.";
      setPasswordError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] dark:bg-zinc-950">
      <div className="min-h-screen w-full flex items-center justify-center p-6">
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

            {/* Contenido según el estado */}
            {status === "success" && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Correo Verificado!
                </h1>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
                  {message ||
                    "Tu correo electrónico ha sido verificado exitosamente. Ahora puedes iniciar sesión."}
                </p>
                <Link
                  href="/login"
                  className="
                    inline-flex items-center justify-center
                    w-full px-6 py-3
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold
                    rounded-xl
                    transition-colors
                    focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                  "
                >
                  Ir a Iniciar Sesión
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Error de Verificación
                </h1>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
                  {message ||
                    "No se pudo verificar el correo. El enlace puede haber expirado o ser inválido."}
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="
                      inline-flex items-center justify-center
                      w-full px-6 py-3
                      bg-blue-600 hover:bg-blue-700
                      text-white font-semibold
                      rounded-xl
                      transition-colors
                      focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                    "
                  >
                    Ir a Iniciar Sesión
                  </Link>
                </div>
              </div>
            )}

            {status === "needs-password" && (
              <div className="py-4">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Verifica tu Correo
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    {message ||
                      "Por favor, establece una contraseña para completar la verificación de tu correo electrónico."}
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="
                          w-full px-4 py-3 pr-12
                          bg-white dark:bg-zinc-800
                          border border-gray-300 dark:border-zinc-700
                          rounded-xl
                          text-gray-900 dark:text-white
                          placeholder-gray-500 dark:placeholder-zinc-400
                          focus:outline-none focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30
                          transition-colors
                        "
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="
                          w-full px-4 py-3 pr-12
                          bg-white dark:bg-zinc-800
                          border border-gray-300 dark:border-zinc-700
                          rounded-xl
                          text-gray-900 dark:text-white
                          placeholder-gray-500 dark:placeholder-zinc-400
                          focus:outline-none focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30
                          transition-colors
                        "
                        placeholder="Confirma tu contraseña"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                        aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="rounded-xl border border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                      {passwordError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="
                      w-full px-6 py-3
                      bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                      text-white font-semibold
                      rounded-xl
                      transition-colors
                      focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                      disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    "
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar y Establecer Contraseña"
                    )}
                  </button>
                </form>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-300">
              ¿Necesitas ayuda?{" "}
              <a
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                href="#"
              >
                Contacta con soporte
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
