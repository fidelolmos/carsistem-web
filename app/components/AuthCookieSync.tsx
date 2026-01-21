"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken, setAuthCookie } from "@/src/lib/auth";

/**
 * Sincroniza la cookie `auth` con el token en localStorage:
 * - Si hay token y no hay cookie (p. ej. sesión antigua): pone la cookie.
 * - Si hay token y la ruta es /login: pone la cookie y redirige a /.
 */
export default function AuthCookieSync() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) return;
    setAuthCookie();
    if (pathname === "/login") router.replace("/");
  }, [pathname, router]);

  return null;
}
