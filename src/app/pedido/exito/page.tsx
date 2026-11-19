export default function PagoExitoPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 28 }}>¡Gracias por tu compra!</h1>
      <p style={{ margin: "16px 0" }}>
        Estamos confirmando tu pago. Cuando se acredite, tu pedido queda listo para retirar en el local.
      </p>
      <a href="/tienda">Volver a la tienda</a>
    </main>
  );
}

