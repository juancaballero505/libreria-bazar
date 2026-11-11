export type OrderItemInput = {
  productId: string;
  quantity: number;
};

export type OrderInput = {
  customerName: string | null;
  customerEmail: string | null;
  items: OrderItemInput[];
};

type ParseResult =
  | { ok: true; data: OrderInput }
  | { ok: false; error: string };

const isPositiveInt = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v > 0;

export function parseOrderBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "El body debe ser un objeto JSON" };
  }
  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.items) || b.items.length === 0) {
    return { ok: false, error: "items debe ser una lista con al menos un producto" };
  }

  const items: OrderItemInput[] = [];
  for (const item of b.items) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Cada item debe ser un objeto" };
    }
    const it = item as Record<string, unknown>;

    if (typeof it.productId !== "string" || !it.productId) {
      return { ok: false, error: "productId es obligatorio en cada item" };
    }
    if (!isPositiveInt(it.quantity)) {
      return { ok: false, error: "quantity debe ser un entero mayor a 0" };
    }

    items.push({ productId: it.productId, quantity: it.quantity as number });
  }

  const customerName =
    typeof b.customerName === "string" && b.customerName.trim()
      ? b.customerName.trim()
      : null;

  const customerEmail =
    typeof b.customerEmail === "string" && b.customerEmail.trim()
      ? b.customerEmail.trim()
      : null;

  return { ok: true, data: { customerName, customerEmail, items } };
}