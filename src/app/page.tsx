import Image from "next/image";
import Link from "next/link";

const LIBRERIA = [
  { nombre: "Lapicera BIC azul y negra", precio: 1200, img: "/imagenes/lapicera-bic.webp" },
  { nombre: "Lápiz BIC", precio: 600, img: "/imagenes/lapiz-bic.webp" },
  { nombre: "Bloc A4 Triunfante", precio: 4000, img: "/imagenes/bloc-a4.webp" },
  { nombre: "Corrector SDX", precio: 2000, img: "/imagenes/corrector-sdx.webp" },
];

const BAZAR = [
  { nombre: "Taza para regalo", precio: 3000, img: "/imagenes/tazas-regalo.webp" },
  { nombre: "Jarrón de vidrio", precio: 5000, img: "/imagenes/jarron.webp" },
];

function Producto({ nombre, precio, img }: { nombre: string; precio: number; img: string }) {
  return (
    <div className="aero-card" style={{ textAlign: "center" }}>
      <Image
        src={img}
        alt={nombre}
        width={400}
        height={400}
        style={{ width: "100%", height: "auto", borderRadius: 12 }}
      />
      <p style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>{nombre}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: "#0b5fa8" }}>
        ${precio.toLocaleString("es-AR")}
      </p>
    </div>
  );
}

function Frase({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 34,
        fontWeight: 800,
        color: "#0b4f86",
        textAlign: "center",
        textShadow: "0 2px 0 rgba(255,255,255,0.9)",
        margin: "8px 0 24px",
      }}
    >
      {children}
    </p>
  );
}

const grilla = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
} as const;

const seccion = { padding: "40px 24px", maxWidth: 1100, margin: "0 auto" } as const;

export default function HomePage() {
  return (
    <>
      {/* Fondo de pantalla completa, con velo para que el texto se lea */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundImage: "url(/imagenes/fondo.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: -1, background: "rgba(255,255,255,0.3)" }} />

      <header style={{ textAlign: "center", padding: "56px 24px 32px" }}>
        <h1 style={{ fontSize: 60, fontWeight: 800, color: "#0b4f86", textShadow: "0 3px 0 #fff" }}>
          Librería Bazar
        </h1>
        <p style={{ fontSize: 22, color: "#1a2b3c", marginBottom: 28 }}>Tu espacio, siempre.</p>
        <Link
          href="/tienda"
          className="aero-btn"
          style={{ fontSize: 22, padding: "18px 44px", textDecoration: "none", display: "inline-block" }}
        >
          Armar pedido
        </Link>
        <nav style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginTop: 32, fontSize: 18, fontWeight: 700 }}>
          <a href="#libreria" style={{ color: "#0b4f86" }}>Librería</a>
          <a href="#bazar" style={{ color: "#0b4f86" }}>Bazar</a>
          <a href="#impresiones" style={{ color: "#0b4f86" }}>Impresiones</a>
          <a href="#ofertas" style={{ color: "#0b4f86" }}>Ofertas</a>
        </nav>
      </header>

      <section id="libreria" style={seccion}>
        <Frase>«Inspiración en cada página»</Frase>
        <div style={grilla}>
          {LIBRERIA.map((p) => <Producto key={p.nombre} {...p} />)}
        </div>
      </section>

      <section id="bazar" style={seccion}>
        <Frase>«Dale color a tu hogar»</Frase>
        <div style={grilla}>
          {BAZAR.map((p) => <Producto key={p.nombre} {...p} />)}
        </div>
      </section>

      <section id="impresiones" style={seccion}>
        <Frase>«Todo listo para seguir aprendiendo»</Frase>
        <div className="aero-card" style={{ padding: 12 }}>
          <Image
            src="/imagenes/impresiones.webp"
            alt="Servicio de impresiones: precios y tiempos de entrega"
            width={1024}
            height={1536}
            style={{ width: "100%", height: "auto", borderRadius: 12 }}
          />
        </div>
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/tienda" className="aero-btn" style={{ textDecoration: "none", display: "inline-block" }}>
            Subir mi archivo
          </Link>
        </p>
      </section>

      <section id="ofertas" style={seccion}>
        <Frase>«Grandes ideas, pequeños precios»</Frase>
        <div className="aero-card" style={{ textAlign: "center", padding: 32 }}>
          <p style={{ fontSize: 22, fontWeight: 700 }}>Ofertas con 30% de descuento</p>
          <p className="aero-muted">Próximamente: productos seleccionados de librería y bazar.</p>
        </div>
      </section>

      <footer className="aero-card" style={{ margin: "24px auto 40px", maxWidth: 1100, textAlign: "center" }}>
        <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Librería Bazar</p>
        <p className="aero-muted">Dirección: Godoy Cruz 1899,Ciudad Lujan de Cuyo a metros de Calle Sanmartin</p>
        <p className="aero-muted">Horario de atención: Lunes a Sabado de 07:00 a 22:00</p>
        <p className="aero-muted">Teléfono / WhatsApp: 2615540465</p>
        <p className="aero-muted">Email: libreriabazar73@gmail.com</p>
      </footer>
    </>
  );
}