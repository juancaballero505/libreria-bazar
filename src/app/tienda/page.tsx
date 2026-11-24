"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  reserved: number;
};

type CartLine = { product: Product; quantity: number };

const disponible = (p: Product) => p.stock - p.reserved;
type PrintLine = {
  id: string;          // id del PrintJob devuelto por la subida
  fileName: string;
  pages: number;
  copies: number;
  color: boolean;
  duplex: boolean;
  paper: "a4" | "foto";
  price: number;
};

export default function TiendaPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [carrito, setCarrito] = useState<CartLine[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impresiones, setImpresiones] = useState<PrintLine[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [opciones, setOpciones] = useState({
    copies: 1,
    color: false,
    duplex: false,
    paper: "a4" as "a4" | "foto",
  });
  const [subiendo, setSubiendo] = useState(false);
  useEffect(() => {
    fetch("/api/products?active=true")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los productos");
        return res.json();
      })
      .then((data: Product[]) => setProductos(data.filter((p) => disponible(p) > 0)))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setCargando(false));
  }, []);

  function cantidadEnCarrito(id: string) {
    return carrito.find((l) => l.product.id === id)?.quantity ?? 0;
  }

  function agregar(p: Product) {
    if (cantidadEnCarrito(p.id) >= disponible(p)) return;
    setCarrito((prev) => {
      const linea = prev.find((l) => l.product.id === p.id);
      if (linea) {
        return prev.map((l) =>
          l.product.id === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }

  function quitar(id: string) {
    setCarrito((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  const totalImpresion = impresiones.reduce((s, p) => s + p.price, 0);
  const total = carrito.reduce((s, l) => s + l.product.price * l.quantity, 0) + totalImpresion;
  
  async function subirArchivo() {
    if (!archivo) return;
    setError(null);
    setSubiendo(true);

    const form = new FormData();
    form.append("file", archivo);
    form.append("copies", String(opciones.copies));
    form.append("color", String(opciones.color || opciones.paper === "foto"));
    form.append("duplex", String(opciones.duplex));
    form.append("paper", opciones.paper);

    try {
      const res = await fetch("/api/prints/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir el archivo");

      setImpresiones((prev) => [
        ...prev,
        {
          id: data.id,
          fileName: archivo.name,
          pages: data.pages,
          copies: data.copies,
          color: data.color,
          duplex: data.duplex,
          paper: data.paper,
          price: data.price,
        },
      ]);
      setArchivo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  function quitarImpresion(id: string) {
    setImpresiones((prev) => prev.filter((p) => p.id !== id));
  }
  
  async function pagar() {
    setError(null);

    if (carrito.length === 0 && impresiones.length === 0) {
      setError("Agregá al menos un producto o un archivo para imprimir");
      return;
    }
    if (!nombre.trim() || !email.includes("@")) {
      setError("Completá tu nombre y un email válido");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: nombre,
          customerEmail: email,
          items: carrito.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          printJobIds: impresiones.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el pedido");
      // Va a la página de pago de Mercado Pago
      window.location.href = data.initPoint;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setEnviando(false);
    }
  }

  if (cargando) return <p className="aero-status">Cargando productos...</p>;

  return (
    <main className="aero-main">
      <h1 className="aero-title">Tienda</h1>

      {productos.length === 0 && <p className="aero-muted">No hay productos disponibles en este momento.</p>}

      {productos.map((p) => (
        <section key={p.id} className="aero-card">
          <p style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</p>
          {p.description && <p className="aero-muted">{p.description}</p>}
          <p>
            ${p.price} · quedan {disponible(p)}
          </p>
          <button
            onClick={() => agregar(p)}
            disabled={cantidadEnCarrito(p.id) >= disponible(p)}
            className="aero-btn"
          >
            Agregar
          </button>
        </section>
      ))}

      <h2 className="aero-subtitle">Tu carrito</h2>
      {carrito.length === 0 && <p className="aero-muted">Todavía no agregaste productos.</p>}

      {carrito.map((l) => (
        <div
          key={l.product.id}
          className="aero-card"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>
            {l.product.name} x {l.quantity}
          </span>
          <span>
            <button onClick={() => quitar(l.product.id)} className="aero-btn aero-btn-small">−</button>
            <button onClick={() => agregar(l.product)} className="aero-btn aero-btn-small">+</button>
          </span>
        </div>
      ))}

      <p className="aero-total">Total: ${total}</p>
      <h2 className="aero-subtitle">Imprimir un archivo</h2>
      <div className="aero-card">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="aero-input"
        />

        <label className="aero-muted">Papel</label>
        <select
          value={opciones.paper}
          onChange={(e) => {
            const paper = e.target.value as "a4" | "foto";
            setOpciones((o) => ({
              ...o,
              paper,
              color: paper === "foto" ? true : o.color,
              duplex: paper === "foto" ? false : o.duplex,
            }));
          }}
          className="aero-input"
        >
          <option value="a4">A4</option>
          <option value="foto">Papel foto ($300 por hoja)</option>
        </select>

        <label className="aero-muted">
          <input
            type="checkbox"
            checked={opciones.color}
            disabled={opciones.paper === "foto"}
            onChange={(e) => setOpciones((o) => ({ ...o, color: e.target.checked, duplex: e.target.checked ? false : o.duplex }))}
          />{" "}
          Color (solo simple faz)
        </label>

        <label className="aero-muted" style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={opciones.duplex}
            disabled={opciones.color || opciones.paper === "foto"}
            onChange={(e) => setOpciones((o) => ({ ...o, duplex: e.target.checked }))}
          />{" "}
          Doble faz
        </label>

        <label className="aero-muted">Copias</label>
        <input
          type="number"
          min={1}
          value={opciones.copies}
          onChange={(e) => setOpciones((o) => ({ ...o, copies: Math.max(1, Number(e.target.value) || 1) }))}
          className="aero-input"
        />

        <button
          onClick={subirArchivo}
          disabled={!archivo || subiendo}
          className="aero-btn aero-btn-block"
        >
          {subiendo ? "Subiendo..." : "Agregar archivo al pedido"}
        </button>
      </div>

      {impresiones.map((p) => (
        <div key={p.id} className="aero-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {p.fileName} · {p.pages} pág · {p.copies} copia(s) · {p.paper === "foto" ? "foto" : "A4"}
            {p.color ? " · color" : " · B/N"}{p.duplex ? " · doble faz" : ""} — ${p.price}
          </span>
          <button onClick={() => quitarImpresion(p.id)} className="aero-btn aero-btn-small">Quitar</button>
        </div>
      ))}
      <h2 className="aero-subtitle">Tus datos</h2>
      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="aero-input"
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="aero-input"
      />

      {error && <p className="aero-error" style={{ marginTop: 12 }}>{error}</p>}

      <button
        onClick={pagar}
        disabled={enviando || (carrito.length === 0 && impresiones.length === 0)}
        className="aero-btn aero-btn-block"
      >
        {enviando ? "Preparando el pago..." : "Pagar con Mercado Pago"}
      </button>
    </main>
  );
}