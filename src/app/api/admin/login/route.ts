import { NextRequest, NextResponse } from "next/server";
import { crearSesion, NOMBRE_COOKIE, DURACION_COOKIE } from "@/lib/auth";

// POST /api/admin/login
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(NOMBRE_COOKIE, crearSesion(), {
    httpOnly: true, // el navegador la guarda, pero el JavaScript de la página no la lee
    sameSite: "lax",
    secure: true, // ngrok y el hosting usan https
    path: "/",
    maxAge: DURACION_COOKIE,
  });
  return res;
}