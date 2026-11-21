import { NextRequest, NextResponse } from "next/server";
import { sesionValida, NOMBRE_COOKIE } from "@/lib/auth";

// Devuelve null si la sesión es válida, o una respuesta 401 si no lo es
export function exigirAdmin(req: NextRequest) {
  const valida = sesionValida(req.cookies.get(NOMBRE_COOKIE)?.value);
  return valida ? null : NextResponse.json({ error: "No autorizado" }, { status: 401 });
}


