"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth, type LoginResponse } from "@/lib/auth-context";
import { etiqueta } from "@/lib/format";
import { Alert, Button, Card, CardHeader, Field, Input, PageHeader } from "@/components/ui";

export default function CuentaPage() {
  const { sesion, aplicarLogin } = useAuth();
  const [form, setForm] = useState({ actual: "", nueva: "", repetir: "" });
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cambiar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(false);
    if (form.nueva !== form.repetir) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setGuardando(true);
    try {
      aplicarLogin(await api.post<LoginResponse>("/api/auth/cambiar-contrasena", { actual: form.actual, nueva: form.nueva }));
      setForm({ actual: "", nueva: "", repetir: "" });
      setListo(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader title="Mi cuenta" description={sesion ? `${sesion.nombre} · ${etiqueta(sesion.rol)}` : undefined} />

      <Card className="max-w-xl">
        <CardHeader title="Cambiar contraseña" description="Al cambiarla se cierran tus sesiones abiertas en otros equipos." />
        <form onSubmit={cambiar} className="space-y-4 p-5">
          <Field label="Contraseña actual">
            <Input type="password" required autoComplete="current-password" value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} />
          </Field>
          <Field label="Nueva contraseña" hint="Al menos 10 caracteres, con letras y números.">
            <Input type="password" required minLength={10} autoComplete="new-password" value={form.nueva} onChange={(e) => setForm((f) => ({ ...f, nueva: e.target.value }))} />
          </Field>
          <Field label="Repite la nueva contraseña">
            <Input type="password" required minLength={10} autoComplete="new-password" value={form.repetir} onChange={(e) => setForm((f) => ({ ...f, repetir: e.target.value }))} />
          </Field>
          {error && <Alert>{error}</Alert>}
          {listo && <Alert tone="ok">Contraseña cambiada. Tus otras sesiones se cerraron.</Alert>}
          <div className="flex justify-end">
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-[0.93rem] text-ink-3">
        <Link href="/legal/terminos" className="font-semibold text-brand-text hover:underline">
          Términos y condiciones
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacidad" className="font-semibold text-brand-text hover:underline">
          Política de privacidad
        </Link>
      </p>
    </>
  );
}
