import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/mercadopago
export async function POST(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const body = await req.json().catch(() => null);

  // Formato nuevo: type y data.id (en el cuerpo o en la URL)
  // Formato antiguo: topic e id (en la URL)
  const type = params.get("type") ?? params.get("topic") ?? body?.type ?? body?.topic ?? null;
  const paymentId = params.get("data.id") ?? params.get("id") ?? body?.data?.id ?? null;

  // Solo nos interesan los pagos. Los merchant_order se ignoran porque
  // Mercado Pago también manda un aviso por cada pago.
  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN" }, { status: 500 });
  }

  // No confiamos en el aviso: consultamos el estado real del pago
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

  // Solo cambia si el pedido sigue en pending: si el aviso llega dos veces, no pasa nada
  await prisma.order.updateMany({
    where: { id: String(payment.external_reference), status: "pending" },
    data: { status: "paid", mpPaymentId: String(payment.id) },
  });

  return NextResponse.json({ ok: true });
}



