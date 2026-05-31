"use client";

import { useConvexAuth } from "convex/react";
import { LoginPage } from "@/components/auth/LoginPage";

export default function Home() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="auth-container">
        <p style={{ color: "var(--muted)" }}>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <div className="empty-state">
        <h2>Supervisor de consumo APIs IA</h2>
        <p>
          Has iniciado sesión correctamente. El dashboard estará disponible
          cuando se complete la migración del frontend.
        </p>
      </div>
    </div>
  );
}
