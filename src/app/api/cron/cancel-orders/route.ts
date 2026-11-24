import { NextRequest, NextResponse } from "next/server";
import { cancelExpiredOrders } from "@/lib/orders";

// GET /api/cron/cancel-orders
// Solo responde si el request trae el token secreto en el header Authorization
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const canceladas = await cancelExpiredOrders();
  return NextResponse.json({ ok: true, canceladas });
}