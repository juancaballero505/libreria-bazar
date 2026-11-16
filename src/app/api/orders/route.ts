import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseOrderBody, OrderItemInput } from "@/lib/orders";
import { createPreference } from "@/lib/mercadopago";

class OrderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function mergeItems(items: OrderItemInput[]): OrderItemInput[] {
  const map = new Map<string, number>();
  for (const it of items) {
    map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  }
  return Array.from(map, ([productId, quantity]) => ({ productId, quantity }));
}

// POST /api/orders
export async function POST(req: NextRequest) {
  const parsed = parseOrderBody(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { customerName, customerEmail } = parsed.data;
  const items = mergeItems(parsed.data.items);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      let total = 0;
      const orderItems = items.map((item) => {
        const product = byId.get(item.productId);
        if (!product || !product.active) {
          throw new OrderError(`Producto no disponible: ${item.productId}`, 400);
        }
        total += product.price * item.quantity;
        return { productId: product.id, quantity: item.quantity, price: product.price };
      });

      for (const item of items) {
        const r = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (r.count === 0) {
          throw new OrderError(`Stock insuficiente para el producto ${item.productId}`, 409);
        }
      }

      const order = await tx.order.create({
        data: {
          customerName,
          customerEmail,
          status: "pending",
          total,
          discount: 0,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      const pref = await createPreference({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: orderItems.map((it) => ({
          quantity: it.quantity,
          price: it.price,
          product: { name: byId.get(it.productId)?.name ?? "Producto" },
        })),
      });

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { mpPreferenceId: pref.id },
        include: { items: true },
      });

      return { order: updated, initPoint: pref.sandboxInitPoint };
    });

    return NextResponse.json({ ...result.order, initPoint: result.initPoint }, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/orders?status=paid
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}





