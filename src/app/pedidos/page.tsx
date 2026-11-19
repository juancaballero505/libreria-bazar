"use client";

import { useEffect, useState } from "react";

type Item = { id: string; quantity: number; price: number };
type Order = {
  id: string;
  customerName: string | null;
  total: number;
  createdAt: string;
  items: Item[];
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch("/api/orders?status=paid");
      if (!res.ok) throw new Error("No se pudieron cargar los pedidos");
      setPedidos(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarEntregado(order: Order) {
    const ok = window.confirm(
      `¿Confirmás que ${order.customerName ?? "el cliente"} retiró su pedido por $${order.total}?`
    );
    if (!ok) return;

    const res = await fetch(`/api/orders/${order.id}/deliver`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo marcar como entregado");
      return;
    }
    setPedidos((prev) => prev.filter((p) => p.id !== order.id));
  }

  if (cargando) return <p className="aero-status">Cargando pedidos...</p>;
  if (error) return <p className="aero-status aero-error">{error}</p>;

  return (
    <main className="aero-main">
      <h1 className="aero-title">Por retirar</h1>

      {pedidos.length === 0 && <p className="aero-muted">No hay pedidos pendientes de retiro.</p>}

      {pedidos.map((p) => (
        <section key={p.id} className="aero-card">
          <p style={{ fontSize: 20, fontWeight: 600 }}>{p.customerName ?? "Sin nombre"}</p>
          <p>Total: ${p.total}</p>
          <ul>
            {p.items.map((it) => (
              <li key={it.id}>
                {it.quantity} x ${it.price}
              </li>
            ))}
          </ul>
          <button onClick={() => marcarEntregado(p)} className="aero-btn aero-btn-block">
            Entregado
          </button>
        </section>
      ))}

      <p style={{ marginTop: 24 }}>
        <a href="/pedidos/entregados">Ver pedidos entregados</a>
      </p>
    </main>
  );
}