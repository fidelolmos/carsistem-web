import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware que se ejecuta en el edge *antes* de servir la página.
 * Si la ruta es protegida y no hay cookie `auth`, redirige a /login
 * sin llegar a renderizar el HTML, evitando el flash de contenido.
 */
export function middleware(request: NextRequest) {
  const auth = request.cookies.get("auth")?.value;
  if (auth) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/",
    "/citas",
    "/citas/:path*",
    "/clientes",
    "/clientes/:path*",
    "/sucursales",
    "/sucursales/:path*",
    "/usuarios-y-roles",
    "/usuarios-y-roles/:path*",
  ],
};
