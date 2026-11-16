type OrderForPayment = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  items: { quantity: number; price: number; product: { name: string } }[];
};

export async function createPreference(order: OrderForPayment) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN en .env");

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const body = {
    items: order.items.map((it) => ({
      title: it.product.name,
      quantity: it.quantity,
      unit_price: it.price,
      currency_id: "ARS",
    })),
    external_reference: order.id,notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    payer: order.customerEmail
      ? { email: order.customerEmail, name: order.customerName ?? undefined }
      : undefined,
    back_urls: {
      success: `${baseUrl}/pedido/exito`,
      pending: `${baseUrl}/pedido/pendiente`,
      failure: `${baseUrl}/pedido/error`,
    },
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Mercado Pago respondió ${res.status}: ${await res.text()}`);
  }

  const pref = await res.json();
  return {
    id: pref.id as string,
    initPoint: pref.init_point as string,
    sandboxInitPoint: pref.sandbox_init_point as string,
  };
}



