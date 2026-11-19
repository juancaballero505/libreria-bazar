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
    // Lo sacamos de la lista sin recargar la página
    setPedidos((prev) => prev.filter((p) => p.id !== order.id));
  }

  if (cargando) return <p style={{ padding: 24 }}>Cargando pedidos...</p>;
  if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>;

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Por retirar</h1>

      {pedidos.length === 0 && <p>No hay pedidos pendientes de retiro.</p>}

      {pedidos.map((p) => (
        <section
          key={p.id}
          style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16, marginBottom: 12 }}
        >
          <p style={{ fontSize: 20, fontWeight: 600 }}>{p.customerName ?? "Sin nombre"}</p>
          <p>Total: ${p.total}</p>
          <ul>
            {p.items.map((it) => (
              <li key={it.id}>
                {it.quantity} x ${it.price}
              </li>
            ))}
          </ul>
          <button
            onClick={() => marcarEntregado(p)}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 18,
              borderRadius: 10,
              background: "#1583d7",
              color: "white",
              border: "none",
              marginTop: 8,
            }}
          >
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


