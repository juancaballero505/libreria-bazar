"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  customerName: string | null;
  total: number;
  deliveredAt: string | null;
};

export default function EntregadosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders?status=delivered")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los pedidos");
        return res.json();
      })
      .then((data: Order[]) => setPedidos(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p style={{ padding: 24 }}>Cargando pedidos...</p>;
  if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>;

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Entregados</h1>

      {pedidos.length === 0 && <p>Todavía no hay pedidos entregados.</p>}

      {pedidos.map((p) => (
        <section
          key={p.id}
          style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16, marginBottom: 12 }}
        >
          <p style={{ fontSize: 18, fontWeight: 600 }}>{p.customerName ?? "Sin nombre"}</p>
          <p>Total: ${p.total}</p>
          <p style={{ color: "#555" }}>
            Entregado: {p.deliveredAt ? new Date(p.deliveredAt).toLocaleString("es-AR") : "-"}
          </p>
        </section>
      ))}

      <p style={{ marginTop: 24 }}>
        <a href="/pedidos">← Volver a por retirar</a>
      </p>
    </main>
  );
}

