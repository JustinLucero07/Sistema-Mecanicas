"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { EMPRESA } from "@/lib/empresa";
import { Alert, Button } from "@/components/ui";

/** Antes de usar el sistema, cada usuario acepta la versión vigente de los términos. */
export default function TerminosGate() {
  const { aceptarTerminos, logout } = useAuth();
  const [leido, setLeido] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function aceptar() {
    setGuardando(true);
    setError(null);
    try {
      await aceptarTerminos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la aceptación.");
      setGuardando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-7 shadow-card">
        <h1 className="font-display text-3xl font-semibold">Antes de empezar</h1>
        <p className="mt-3 text-ink-2">
          Para usar {EMPRESA.nombreComercial} necesitamos que leas y aceptes los términos de uso y la política de privacidad.
          Explican cómo se cuidan los datos del taller y de sus clientes.
        </p>
        <ul className="mt-5 space-y-2">
          <li>
            <a href="/legal/terminos" target="_blank" className="font-semibold text-brand-text underline">
              Términos y condiciones
            </a>
          </li>
          <li>
            <a href="/legal/privacidad" target="_blank" className="font-semibold text-brand-text underline">
              Política de privacidad
            </a>
          </li>
        </ul>
        <label className="mt-6 flex items-start gap-3 rounded-lg border border-line p-3 has-checked:border-brand has-checked:bg-brand-soft">
          <input type="checkbox" checked={leido} onChange={(e) => setLeido(e.target.checked)} className="mt-1 size-4 accent-[var(--brand)]" />
          <span className="text-[0.93rem]">Leí y acepto los términos y condiciones y la política de privacidad.</span>
        </label>
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="ghost" onClick={logout}>
            Salir
          </Button>
          <Button onClick={aceptar} disabled={!leido || guardando}>
            {guardando ? "Guardando…" : "Aceptar y continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
