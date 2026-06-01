"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}

      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="field">
        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <button className="primary-button full" type="submit" disabled={pending}>
        {pending ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
