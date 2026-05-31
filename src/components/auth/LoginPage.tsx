"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Supervisor de consumo</h1>
        <p>Control de APIs IA</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            Registrarse
          </button>
        </div>

        {tab === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
