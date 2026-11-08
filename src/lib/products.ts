import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

const isNonNegInt = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;

const isNonNegNumber = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

// partial = true se usa en PUT: solo se validan los campos que lleguen
export function parseProductBody(body: unknown, partial = false): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "El body debe ser un objeto JSON" };
  }

  const b = body as Record<string, unknown>;
  const required = !partial;
  const data: Record<string, unknown> = {};

  if (b.name !== undefined || required) {
    if (typeof b.name !== "string" || !b.name.trim()) {
      return { ok: false, error: "name es obligatorio" };
    }
    data.name = b.name.trim();
  }

  if (b.sku !== undefined || required) {
    if (typeof b.sku !== "string" || !b.sku.trim()) {
      return { ok: false, error: "sku es obligatorio" };
    }
    data.sku = b.sku.trim().toUpperCase();
  }

  if (b.price !== undefined || required) {
    if (!isNonNegNumber(b.price)) {
      return { ok: false, error: "price debe ser un número mayor o igual a 0" };
    }
    data.price = b.price;
  }

  if (b.stock !== undefined) {
    if (!isNonNegInt(b.stock)) {
      return { ok: false, error: "stock debe ser un entero mayor o igual a 0" };
    }
    data.stock = b.stock;
  }

  if (b.minStock !== undefined) {
    if (!isNonNegInt(b.minStock)) {
      return { ok: false, error: "minStock debe ser un entero mayor o igual a 0" };
    }
    data.minStock = b.minStock;
  }

  if (b.description !== undefined) {
    data.description =
      typeof b.description === "string" && b.description.trim()
        ? b.description.trim()
        : null;
  }

  if (b.imageUrl !== undefined) {
    data.imageUrl =
      typeof b.imageUrl === "string" && b.imageUrl.trim()
        ? b.imageUrl.trim()
        : null;
  }

  if (b.categoryId !== undefined) {
    data.categoryId =
      typeof b.categoryId === "string" && b.categoryId ? b.categoryId : null;
  }

  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") {
      return { ok: false, error: "active debe ser true o false" };
    }
    data.active = b.active;
  }

  return { ok: true, data };
}

// Convierte los errores de Prisma en respuestas HTTP entendibles
export function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese sku" }, { status: 409 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    if (e.code === "P2003") {
      return NextResponse.json({ error: "La categoría indicada no existe" }, { status: 400 });
    }
  }
  console.error(e);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}

