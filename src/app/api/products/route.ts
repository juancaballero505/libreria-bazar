import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseProductBody, handlePrismaError } from "@/lib/products";
import { exigirAdmin } from "@/lib/admin";
// GET /api/products?search=cuaderno&categoryId=...&active=true
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const search = params.get("search")?.trim();
  const categoryId = params.get("categoryId");
  const active = params.get("active");

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search.toUpperCase() } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (active !== null) where.active = active === "true";

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/products
export async function POST(req: NextRequest) {
  const noAutorizado = exigirAdmin(req);
  if (noAutorizado) return noAutorizado;
  const parsed = parseProductBody(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: parsed.data as Prisma.ProductUncheckedCreateInput,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return handlePrismaError(e);
  }
}

