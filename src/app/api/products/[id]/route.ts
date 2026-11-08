import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseProductBody, handlePrismaError } from "@/lib/products";

type Context = { params: Promise<{ id: string }> };

// GET /api/products/:id
export async function GET(_req: NextRequest, { params }: Context) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, promotions: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT /api/products/:id  (se envían solo los campos que cambian)
export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;

  const parsed = parseProductBody(await req.json().catch(() => null), true);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data as Prisma.ProductUncheckedUpdateInput,
    });
    return NextResponse.json(product);
  } catch (e) {
    return handlePrismaError(e);
  }
}

// DELETE /api/products/:id
// No borra el registro: lo desactiva. Así los pedidos viejos conservan su historial.
export async function DELETE(_req: NextRequest, { params }: Context) {
  const { id } = await params;

  try {
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handlePrismaError(e);
  }
}

