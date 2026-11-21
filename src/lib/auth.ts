import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "admin_session";
const DURACION = 12 * 60 * 60; // 12 horas en segundos

function firmar(valor: string) {
  const secreto = process.env.ADMIN_PASSWORD;
  if (!secreto) throw new Error("Falta ADMIN_PASSWORD en .env");
  return createHmac("sha256", secreto).update(valor).digest("hex");
}

// Crea el valor de la cookie: vencimiento + firma
export function crearSesion() {
  const vence = Date.now() + DURACION * 1000;
  const payload = String(vence);
  return `${payload}.${firmar(payload)}`;
}

// Verifica que la cookie esté firmada y no haya vencido
export function sesionValida(valor: string | undefined) {
  if (!valor) return false;
  const [payload, firma] = valor.split(".");
  if (!payload || !firma) return false;

  const esperada = firmar(payload);
  const ok =
    firma.length === esperada.length &&
    timingSafeEqual(Buffer.from(firma), Buffer.from(esperada));
  if (!ok) return false;

  return Number(payload) > Date.now();
}

export const NOMBRE_COOKIE = COOKIE;
export const DURACION_COOKIE = DURACION;

