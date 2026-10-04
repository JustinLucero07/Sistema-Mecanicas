"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { nombreCliente } from "@/lib/format";
import type { Cliente } from "@/lib/types";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Td, Textarea, Th } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { esAdmin } from "@/components/ProtectedShell";

const FORM_VACIO = { nombre: "", apellidos: "", cedula_ruc: "", telefono: "", whatsapp: "", email: "", ciudad: "", direccion: "", notas: "" };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [consiente, setConsiente] = useState(false);
  const [privacidad, setPrivacidad] = useState<Cliente | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const { sesion } = useAuth();
  const admin = esAdmin(sesion?.rol);

  function cargar() {
    api
      .get<Cliente[]>("/api/clientes")
      .then(setClientes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar los clientes."));
  }

  useEffect(cargar, []);

  const set = (campo: keyof typeof FORM_VACIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);
    setGuardando(true);
    try {
      const datos = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]));
      await api.post<Cliente>("/api/clientes", { ...datos, acepta_comunicaciones: consiente });
      setForm(FORM_VACIO);
      setConsiente(false);
      setModalOpen(false);
      cargar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo guardar el cliente.");
    } finally {
      setGuardando(false);
    }
  }

  async function exportar(c: Cliente) {
    setError(null);
    try {
      const datos = await api.get(`/api/clientes/${c.id}/exportar`);
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
      enlace.download = `datos-cliente-${c.id}.json`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
      setAviso(`Se descargaron los datos de ${nombreCliente(c)}. Entrégaselos por un canal seguro.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron exportar los datos.");
    }
  }

  async function anonimizar(c: Cliente) {
    if (!window.confirm(`¿Borrar los datos personales de ${nombreCliente(c)}? Sus órdenes y pagos se conservan sin su nombre. No se puede deshacer.`)) return;
    setError(null);
    try {
      await api.post(`/api/clientes/${c.id}/anonimizar`);
      setPrivacidad(null);
      setAviso("Datos personales eliminados. El historial del vehículo y los pagos se conservan.");
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo anonimizar al cliente.");
    }
  }

  const q = busqueda.trim().toLowerCase();
  const visibles = (clientes ?? []).filter(
    (c) => !q || [nombreCliente(c), c.cedula_ruc, c.telefono, c.email].some((v) => v?.toLowerCase().includes(q)),
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Los dueños de los vehículos. Un cliente puede tener varios."
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Nuevo cliente
          </Button>
        }
      />

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, cédula, teléfono o correo" aria-label="Buscar cliente" className="pl-9" />
      </div>

      {error && <Alert>{error}</Alert>}
      {aviso && <Alert tone="ok">{aviso}</Alert>}

      <Card className="overflow-hidden">
        {clientes === null && !error ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : visibles.length === 0 ? (
          <EmptyState icon={Users} title={q ? `Nadie coincide con “${busqueda}”` : "Aún no hay clientes"} description={q ? undefined : "Crea el primer cliente para poder registrar su vehículo."}>
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Nuevo cliente
            </Button>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead className="border-b border-line">
                <tr>
                  <Th>Cliente</Th>
                  <Th>Cédula o RUC</Th>
                  <Th>Teléfono</Th>
                  <Th>Ciudad</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <p className="font-semibold">{nombreCliente(c)}</p>
                      {c.email && <p className="text-[0.87rem] text-ink-3">{c.email}</p>}
                      {c.acepta_comunicaciones && <Badge tone="ok">Acepta recordatorios</Badge>}
                    </Td>
                    <Td className="text-ink-2">{c.cedula_ruc ?? "—"}</Td>
                    <Td className="text-ink-2">{c.telefono ?? c.whatsapp ?? "—"}</Td>
                    <Td className="text-ink-2">{c.ciudad ?? "—"}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <Link href={`/vehiculos?q=${encodeURIComponent(c.nombre)}`} className="text-[0.87rem] font-semibold text-brand-text hover:underline">
                        Ver vehículos
                      </Link>
                      <Link href={`/vehiculos/nuevo?cliente=${c.id}`} className="ml-4 text-[0.87rem] font-semibold text-brand-text hover:underline">
                        Registrar vehículo
                      </Link>
                      {admin && (
                        <button onClick={() => setPrivacidad(c)} className="ml-4 text-[0.87rem] font-semibold text-ink-3 hover:text-ink">
                          Datos personales
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente" width="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input required autoFocus value={form.nombre} onChange={set("nombre")} />
            </Field>
            <Field label="Apellidos">
              <Input value={form.apellidos} onChange={set("apellidos")} />
            </Field>
            <Field label="Cédula o RUC">
              <Input inputMode="numeric" value={form.cedula_ruc} onChange={set("cedula_ruc")} />
            </Field>
            <Field label="Teléfono">
              <Input type="tel" value={form.telefono} onChange={set("telefono")} />
            </Field>
            <Field label="WhatsApp" hint="Si es distinto del teléfono.">
              <Input type="tel" value={form.whatsapp} onChange={set("whatsapp")} />
            </Field>
            <Field label="Correo">
              <Input type="email" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Ciudad">
              <Input value={form.ciudad} onChange={set("ciudad")} />
            </Field>
            <Field label="Dirección">
              <Input value={form.direccion} onChange={set("direccion")} />
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-line p-3 has-checked:border-brand has-checked:bg-brand-soft">
            <input type="checkbox" checked={consiente} onChange={(e) => setConsiente(e.target.checked)} className="mt-1 size-4 accent-[var(--brand)]" />
            <span className="text-[0.93rem]">
              El cliente acepta recibir recordatorios de mantenimiento y avisos por WhatsApp o correo.
              <span className="block text-[0.8rem] text-ink-3">Márcalo solo si te lo dijo. Puede retirarlo cuando quiera.</span>
            </span>
          </label>
          <Field label="Notas">
            <Textarea value={form.notas} onChange={set("notas")} className="min-h-[4rem]" />
          </Field>
          {errorForm && <Alert>{errorForm}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar cliente"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal open={privacidad !== null} onClose={() => setPrivacidad(null)} title="Datos personales" description={privacidad ? nombreCliente(privacidad) : undefined}>
        {privacidad && (
          <div className="space-y-5">
            <p className="text-ink-2">
              Si el cliente pide ver o llevarse sus datos, o que se borren, usa estas opciones. La ley de protección de datos te obliga a atender esos pedidos.
            </p>
            <div className="rounded-lg border border-line p-4">
              <p className="font-semibold">Entregarle sus datos</p>
              <p className="mt-1 text-[0.93rem] text-ink-3">Descarga un archivo con sus datos, vehículos y órdenes.</p>
              <Button variant="secondary" className="mt-3" onClick={() => exportar(privacidad)}>
                Descargar datos
              </Button>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="font-semibold">Borrar sus datos personales</p>
              <p className="mt-1 text-[0.93rem] text-ink-3">
                Se eliminan nombre, cédula, teléfono, correo y dirección. Las órdenes y pagos se conservan sin su nombre, porque el taller debe guardarlos por ley.
              </p>
              <Button variant="danger" className="mt-3" onClick={() => anonimizar(privacidad)}>
                Borrar datos personales
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
