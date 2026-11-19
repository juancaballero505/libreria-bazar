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

  if (cargando) return <p className="aero-status">Cargando pedidos...</p>;
  if (error) return <p className="aero-status aero-error">{error}</p>;

  return (
    <main className="aero-main">
      <h1 className="aero-title">Entregados</h1>

      {pedidos.length === 0 && <p className="aero-muted">Todavía no hay pedidos entregados.</p>}

      {pedidos.map((p) => (
        <section key={p.id} className="aero-card">
          <p style={{ fontSize: 18, fontWeight: 600 }}>{p.customerName ?? "Sin nombre"}</p>
          <p>Total: ${p.total}</p>
          <p className="aero-muted">
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