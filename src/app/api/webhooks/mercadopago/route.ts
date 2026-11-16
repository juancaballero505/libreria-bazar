import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/mercadopago
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Mercado Pago manda el id del pago en la URL o en el cuerpo
  const paymentId =
    req.nextUrl.searchParams.get("data.id") ?? body?.data?.id ?? null;
  const type = req.nextUrl.searchParams.get("type") ?? body?.type ?? null;

  // Solo nos interesan los avisos de pagos
  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN" }, { status: 500 });
  }

  // No confiamos en el aviso: le preguntamos a Mercado Pago el estado real
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // 502 hace que Mercado Pago reintente más tarde
    return NextResponse.json({ error: "No se pudo consultar el pago" }, { status: 502 });
  }

  const payment = await res.json();

  if (payment.status !== "approved" || !payment.external_reference) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Solo cambia si el pedido sigue en pending: así es idempotente
  await prisma.order.updateMany({
    where: { id: String(payment.external_reference), status: "pending" },
    data: { status: "paid", mpPaymentId: String(payment.id) },
  });

  return NextResponse.json({ ok: true });
}

