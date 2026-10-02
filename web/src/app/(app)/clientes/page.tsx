"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { nombreCliente } from "@/lib/format";
import type { Cliente } from "@/lib/types";
import { Alert, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Td, Textarea, Th } from "@/components/ui";

const FORM_VACIO = { nombre: "", apellidos: "", cedula_ruc: "", telefono: "", whatsapp: "", email: "", ciudad: "", direccion: "", notas: "" };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);

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
      await api.post<Cliente>("/api/clientes", datos);
      setForm(FORM_VACIO);
      setModalOpen(false);
      cargar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo guardar el cliente.");
    } finally {
      setGuardando(false);
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
    </>
  );
}
