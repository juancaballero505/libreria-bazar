import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MP = "https://api.mercadopago.com";

async function mpGet(path: string) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN");
  const res = await fetch(`${MP}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status} en ${path}`);
  return res.json();
}

// Confirma un pago aprobado: pasa el pedido a paid y ajusta stock y reserva.
// Es idempotente: si el pedido ya está pagado, no hace nada.
async function confirmPayment(paymentId: string): Promise<boolean> {
  const payment = await mpGet(`/v1/payments/${paymentId}`);
  if (payment.status !== "approved" || !payment.external_reference) return false;

  const orderId = String(payment.external_reference);
  const mpPaymentId = String(payment.id);

  return prisma.$transaction(async (tx) => {
    // Caso normal: el pedido estaba pending y tiene reserva
    const pagado = await tx.order.updateMany({
      where: { id: orderId, status: "pending" },
      data: { status: "paid", mpPaymentId },
    });

    if (pagado.count === 1) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const it of items) {
        await tx.product.update({
          where: { id: it.productId },
          data: {
            stock: { decrement: it.quantity },
            reserved: { decrement: it.quantity },
          },
        });
      }
      return true;
    }

    // Caso raro: el pedido ya venció y se canceló. La reserva ya se liberó
    const tarde = await tx.order.updateMany({
      where: { id: orderId, status: "cancelled" },
      data: { status: "paid", mpPaymentId },
    });

    if (tarde.count === 1) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const it of items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }
      return true;
    }

    return false;
  });
}

// POST /api/webhooks/mercadopago
export async function POST(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const body = await req.json().catch(() => null);

  // Formato nuevo (type, data.id) o antiguo (topic, id). merchant_order viene con resource
  const topic = params.get("topic") ?? params.get("type") ?? body?.topic ?? body?.type ?? null;
  const id =
    params.get("id") ??
    params.get("data.id") ??
    body?.data?.id ??
    (typeof body?.resource === "string" ? body.resource.split("/").pop() : null);

  if (!topic || !id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    if (topic === "payment") {
      const confirmed = await confirmPayment(String(id));
      return NextResponse.json({ ok: true, confirmed });
    }

    if (topic === "merchant_order") {
      // Consultamos la orden completa y confirmamos sus pagos aprobados
      const mo = await mpGet(`/merchant_orders/${id}`);
      if (mo.order_status !== "paid") {
        return NextResponse.json({ ok: true, ignored: true });
      }
      for (const p of mo.payments ?? []) {
        if (p.status === "approved") await confirmPayment(String(p.id));
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: true });
  } catch (e) {
    console.error(e);
    // 502 hace que Mercado Pago reintente el aviso más tarde
    return NextResponse.json({ error: "No se pudo procesar el aviso" }, { status: 502 });
  }
}





