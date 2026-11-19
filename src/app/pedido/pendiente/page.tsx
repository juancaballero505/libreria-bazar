export default function PagoPendientePage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 28 }}>Tu pago está pendiente</h1>
      <p style={{ margin: "16px 0" }}>
        Mercado Pago todavía no confirmó el pago. Cuando se acredite, tu pedido queda listo para retirar.
      </p>
      <a href="/tienda">Volver a la tienda</a>
    </main>
  );
}


