import { prisma } from "@/lib/prisma";

export const PORCENTAJE_MAXIMO = 50;

// Valida el porcentaje que carga el admin: entero entre 1 y 50
export function validarPorcentaje(p: unknown): number | null {
  if (typeof p !== "number" || !Number.isInteger(p)) return null;
  if (p < 1 || p > PORCENTAJE_MAXIMO) return null;
  return p;
}

// Precio que se cobra hoy por un producto, considerando las promociones vigentes.
// Si hay varias activas para el mismo producto, gana la mayor.
export async function precioVigente(
  productId: string,
  precioBase: number,
  tx = prisma
): Promise<number> {
  const ahora = new Date();
  const promos = await tx.promotion.findMany({
    where: {
      active: true,
      startDate: { lte: ahora },
      endDate: { gte: ahora },
      productos: { some: { productId } },
    },
    select: { porcentaje: true },
  });

  if (promos.length === 0) return precioBase;
  const mayor = Math.max(...promos.map((p) => p.porcentaje));
  return Math.round(precioBase * (1 - mayor / 100));
}