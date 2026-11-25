import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="aero-main" style={{ textAlign: "center", paddingTop: 48 }}>
      <h1 className="aero-title">Panel</h1>

      <div className="aero-card" style={{ display: "grid", gap: 12 }}>
        <Link href="/pedidos" className="aero-btn" style={{ textDecoration: "none", display: "block" }}>
          Por retirar
        </Link>
        <Link href="/pedidos/entregados" className="aero-btn" style={{ textDecoration: "none", display: "block" }}>
          Entregados
        </Link>
        <Link href="/admin/productos" className="aero-btn" style={{ textDecoration: "none", display: "block" }}>
          Productos
        </Link>
        <Link href="/admin/impresiones" className="aero-btn" style={{ textDecoration: "none", display: "block" }}>
          Impresiones
        </Link>
      </div>
    </main>
  );
}