import { NextResponse } from "next/server";
import { cancelExpiredOrders } from "@/lib/orders";

// GET /api/cron/cancel-orders
// Cancela los pedidos pending vencidos y libera su reserva
export async function GET() {
  const canceladas = await cancelExpiredOrders();
  return NextResponse.json({ ok: true, canceladas });
}