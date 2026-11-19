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

export default function TiendaPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [carrito, setCarrito] = useState<CartLine[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const total = carrito.reduce((s, l) => s + l.product.price * l.quantity, 0);

  async function pagar() {
    setError(null);

    if (carrito.length === 0) {
      setError("Agregá al menos un producto");
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

  if (cargando) return <p style={{ padding: 24 }}>Cargando productos...</p>;

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Tienda</h1>

      {productos.length === 0 && <p>No hay productos disponibles en este momento.</p>}

      {productos.map((p) => (
        <section key={p.id} style={card}>
          <p style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</p>
          {p.description && <p style={{ color: "#555" }}>{p.description}</p>}
          <p>
            ${p.price} · quedan {disponible(p)}
          </p>
          <button
            onClick={() => agregar(p)}
            disabled={cantidadEnCarrito(p.id) >= disponible(p)}
            style={btnPrimary}
          >
            Agregar
          </button>
        </section>
      ))}

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Tu carrito</h2>
      {carrito.length === 0 && <p>Todavía no agregaste productos.</p>}

      {carrito.map((l) => (
        <div
          key={l.product.id}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
        >
          <span>
            {l.product.name} x {l.quantity}
          </span>
          <span>
            <button onClick={() => quitar(l.product.id)} style={btnSmall}>−</button>
            <button onClick={() => agregar(l.product)} style={btnSmall}>+</button>
          </span>
        </div>
      ))}

      <p style={{ fontSize: 20, marginTop: 8 }}>Total: ${total}</p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Tus datos</h2>
      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={input}
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
      />

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <button
        onClick={pagar}
        disabled={enviando || carrito.length === 0}
        style={{ ...btnPrimary, width: "100%", marginTop: 16, padding: 16, fontSize: 18 }}
      >
        {enviando ? "Preparando el pago..." : "Pagar con Mercado Pago"}
      </button>
    </main>
  );
}

const card = {
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
} as const;

const btnPrimary = {
  padding: "12px 20px",
  fontSize: 16,
  borderRadius: 10,
  background: "#1583d7",
  color: "white",
  border: "none",
} as const;

const btnSmall = { padding: "4px 12px", fontSize: 18, marginLeft: 6 } as const;

const input = {
  display: "block",
  width: "100%",
  padding: 12,
  fontSize: 16,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
} as const;

