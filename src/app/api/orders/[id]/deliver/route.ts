import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/orders/:id/deliver
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // updateMany solo cambia el pedido si sigue en "paid".
  // Si alguien ya lo marcó como entregado, count es 0.
  const result = await prisma.order.updateMany({
    where: { id, status: "paid" },
    data: { status: "delivered", deliveredAt: new Date() },
  });

  if (result.count === 0) {
    // No cambió nada: averiguamos por qué
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `El pedido está en estado "${order.status}", solo se pueden entregar pedidos pagados` },
      { status: 409 }
    );
  }

  // Cambió correctamente: devolvemos el pedido actualizado
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  return NextResponse.json(order);
}



