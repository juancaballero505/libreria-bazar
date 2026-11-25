import { NextRequest, NextResponse } from "next/server";

const NOMBRE_COOKIE = "admin_session";

async function firmar(valor: string, secreto: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(valor));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sesionValida(valor: string | undefined) {
  const secreto = process.env.ADMIN_PASSWORD;
  if (!valor || !secreto) return false;

  const [payload, firma] = valor.split(".");
  if (!payload || !firma) return false;

  const esperada = await firmar(payload, secreto);
  if (firma !== esperada) return false;

  return Number(payload) > Date.now();
}

export async function middleware(req: NextRequest) {
  const valida = await sesionValida(req.cookies.get(NOMBRE_COOKIE)?.value);
  if (!valida) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/pedidos/:path*"],
};

