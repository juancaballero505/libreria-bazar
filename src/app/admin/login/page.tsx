"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Contraseña incorrecta");
      setEnviando(false);
      return;
    }
    router.push("/pedidos");
  }

  return (
    <main className="aero-main">
      <h1 className="aero-title">Ingresar</h1>
      <form onSubmit={entrar} className="aero-card">
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="aero-input"
          autoFocus
        />
        {error && <p className="aero-error">{error}</p>}
        <button type="submit" disabled={enviando || !password} className="aero-btn aero-btn-block">
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}


