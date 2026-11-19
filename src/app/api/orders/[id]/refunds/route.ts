import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundPayment } from "@/lib/mercadopago";

type RefundRequest = {
  items: { orderItemId: string; quantity: number; reason?: string }[];
};

// POST /api/orders/:id/refunds
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => null)) as RefundRequest | null;
  if (!body?.items?.length) {
    return NextResponse.json({ error: "Indicá al menos un item a devolver" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { refunds: true } } },
  });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (order.status !== "paid" && order.status !== "delivered") {
    return NextResponse.json(
      { error: `No se puede devolver un pedido en estado "${order.status}"` },
      { status: 409 }
    );
  }
  if (!order.mpPaymentId) {
    return NextResponse.json({ error: "El pedido no tiene pago de Mercado Pago" }, { status: 409 });
  }

  // 1. Validar todo antes de devolver nada
  const plan: { itemId: string; quantity: number; amount: number; reason: string | null }[] = [];
  for (const r of body.items) {
    const item = order.items.find((i) => i.id === r.orderItemId);
    if (!item) {
      return NextResponse.json({ error: `Item no existe: ${r.orderItemId}` }, { status: 400 });
    }
    if (!Number.isInteger(r.quantity) || r.quantity <= 0) {
      return NextResponse.json({ error: "quantity debe ser un entero mayor a 0" }, { status: 400 });
    }
    const yaDevuelto = item.refunds
      .filter((x) => x.status !== "failed")
      .reduce((s, x) => s + x.quantity, 0);
    if (yaDevuelto + r.quantity > item.quantity) {
      return NextResponse.json(
        { error: `Solo podés devolver ${item.quantity - yaDevuelto} unidad(es) de ese item` },
        { status: 400 }
      );
    }
    plan.push({
      itemId: item.id,
      quantity: r.quantity,
      amount: item.price * r.quantity,
      reason: r.reason ?? null,
    });
  }

  // 2. Por cada item: registrar como pending, devolver en Mercado Pago, marcar el resultado
  for (const p of plan) {
    const refund = await prisma.refund.create({
      data: { orderItemId: p.itemId, quantity: p.quantity, amount: p.amount, reason: p.reason },
    });
    try {
      const mp = await refundPayment(order.mpPaymentId, p.amount, refund.id);
      await prisma.refund.update({
        where: { id: refund.id },
        data: { status: "approved", mpRefundId: String(mp.id) },
      });
    } catch (e) {
      console.error(e);
      await prisma.refund.update({ where: { id: refund.id }, data: { status: "failed" } });
      return NextResponse.json(
        { error: "Mercado Pago no pudo procesar la devolución" },
        { status: 502 }
      );
    }
  }

  // 3. Si todo quedó devuelto, el pedido pasa a refunded
  const actual = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: { include: { refunds: true } } },
  });
  const todoDevuelto = actual!.items.every(
    (it) =>
      it.refunds
        .filter((x) => x.status !== "failed")
        .reduce((s, x) => s + x.quantity, 0) === it.quantity
  );
  if (todoDevuelto) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "refunded" } });
  }

  return NextResponse.json({ ok: true, orderStatus: todoDevuelto ? "refunded" : order.status });
}

