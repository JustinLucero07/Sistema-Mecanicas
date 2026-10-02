"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Alert, Button, Field, Input, Plate } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0d3b3d] p-12 text-white lg:flex">
        <span className="font-display text-2xl font-semibold tracking-tight">MecánicaOS</span>

        <div>
          <div className="-rotate-2">
            <Plate placa="ABC-1234" size="lg" />
          </div>
          <h1 className="mt-10 max-w-[14ch] font-display text-6xl leading-[0.95] font-semibold tracking-tight">
            La placa abre todo el historial.
          </h1>
          <p className="mt-5 max-w-[44ch] text-lg text-white/75">
            Cada visita, cada repuesto y cada pago de un vehículo, a una foto de distancia.
          </p>
        </div>

        <p className="text-[0.87rem] text-white/55">Órdenes de trabajo, inventario y caja del taller en un solo lugar.</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <span className="font-display text-2xl font-semibold tracking-tight lg:hidden">MecánicaOS</span>
          <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight lg:mt-0">Entrar al taller</h2>
          <p className="mt-2 text-ink-2">Usa el correo y la contraseña que te dio el administrador.</p>

          <div className="mt-8 space-y-4">
            <Field label="Correo">
              <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@taller.com" className="h-11" />
            </Field>
            <Field label="Contraseña">
              <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            </Field>
          </div>

          {error && (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          )}

          <Button type="submit" size="lg" disabled={cargando} className="mt-6 w-full">
            {cargando ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </main>
    </div>
  );
}
