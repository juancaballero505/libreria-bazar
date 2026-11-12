import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseOrderBody, OrderItemInput } from "@/lib/orders";
import { Prisma } from "@prisma/client";
// Error propio para poder devolver el status correcto (400, 409, etc.)
class OrderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Junta productos repetidos: [A x1, A x2] -> [A x3]
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
    // Todo dentro de la transacción: si algo falla, se deshace todo
    const order = await prisma.$transaction(async (tx) => {
      // 1. Traer los productos de una sola consulta
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      // 2. Verificar que existan y estén activos, y calcular el total
      let total = 0;
      const orderItems = items.map((item) => {
        const product = byId.get(item.productId);
        if (!product || !product.active) {
          throw new OrderError(`Producto no disponible: ${item.productId}`, 400);
        }
        total += product.price * item.quantity;
        // El precio se guarda tal cual está AHORA: es el precio histórico
        return {
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        };
      });

      // 3. Descontar stock solo si alcanza (evita que dos compras vendan lo mismo)
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new OrderError(
            `Stock insuficiente para el producto ${item.productId}`,
            409
          );
        }
      }

      // 4. Crear el pedido con sus ítems
      return tx.order.create({
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
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}


//GET para listar pedidos

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

