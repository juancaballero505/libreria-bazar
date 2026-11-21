import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseOrderBody, OrderItemInput } from "@/lib/orders";
import { createPreference } from "@/lib/mercadopago";

const HORAS_ENTREGA_IMPRESION = 24;

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

  const { customerName, customerEmail, printJobIds } = parsed.data;
  const items = mergeItems(parsed.data.items);

  try {
    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItems: { productId: string; quantity: number; price: number }[] = [];
      const nombres = new Map<string, string>();

      // 1. Productos: existencia, activo, precio histórico y stock
      if (items.length > 0) {
        const products = await tx.product.findMany({
          where: { id: { in: items.map((i) => i.productId) } },
        });
        const byId = new Map(products.map((p) => [p.id, p]));

        for (const item of items) {
          const product = byId.get(item.productId);
          if (!product || !product.active) {
            throw new OrderError(`Producto no disponible: ${item.productId}`, 400);
          }
          total += product.price * item.quantity;
          nombres.set(product.id, product.name);
          orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
          });
        }

        for (const item of items) {
          const r = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { reserved: { increment: item.quantity } },
          });
          if (r.count === 0) {
            throw new OrderError(`Stock insuficiente para el producto ${item.productId}`, 409);
          }
        }
      }

      // 2. Archivos de impresión: deben existir y no estar usados en otro pedido
      const trabajos = [];
      for (const jobId of printJobIds) {
        const job = await tx.printJob.findUnique({ where: { id: jobId } });
        if (!job || job.orderId) {
          throw new OrderError("Archivo de impresión no disponible", 400);
        }
        trabajos.push(job);
        total += job.price;
      }

      // 3. Crear el pedido
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

      // 4. Vincular cada archivo al pedido, con su fecha límite
      for (const job of trabajos) {
        const vencimiento = new Date(
          order.createdAt.getTime() + HORAS_ENTREGA_IMPRESION * 60 * 60 * 1000
        );
        const r = await tx.printJob.updateMany({
          where: { id: job.id, orderId: null },
          data: { orderId: order.id, dueAt: vencimiento },
        });
        if (r.count === 0) {
          throw new OrderError("Archivo de impresión no disponible", 409);
        }
      }

      // 5. Preferencia de pago: productos y archivos en el mismo link
      const pref = await createPreference({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: [
          ...orderItems.map((it) => ({
            quantity: it.quantity,
            price: it.price,
            product: { name: nombres.get(it.productId) ?? "Producto" },
          })),
          ...trabajos.map((job) => ({
            quantity: 1,
            price: job.price,
            product: { name: `Impresión: ${job.originalName}` },
          })),
        ],
      });

      // 6. Guardar el id de la preferencia
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { mpPreferenceId: pref.id },
        include: { items: true, printJobs: true },
      });

      return { order: updated, initPoint: pref.sandboxInitPoint };
    }, { timeout: 20000 });

    return NextResponse.json(
      { ...result.order, initPoint: result.initPoint },
      { status: 201 }
    );
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
    include: { items: true, printJobs: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}






