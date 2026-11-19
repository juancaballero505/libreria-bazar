export default function PagoErrorPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 28 }}>No pudimos completar el pago</h1>
      <p style={{ margin: "16px 0" }}>
        Tu pedido no se confirmó. Podés intentar de nuevo desde la tienda.
      </p>
      <a href="/tienda">Volver a la tienda</a>
    </main>
  );
}


