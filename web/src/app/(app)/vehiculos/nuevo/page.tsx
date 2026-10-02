"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { nombreCliente } from "@/lib/format";
import type { Cliente, Vehiculo } from "@/lib/types";
import { Alert, Button, ButtonLink, Card, Field, Input, PageHeader, Plate, Select, Skeleton } from "@/components/ui";

function NuevoVehiculoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    placa: searchParams.get("placa") ?? "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    vin_chasis: "",
    kilometraje_actual: "",
    tipo: "auto",
    combustible: "gasolina",
    transmision: "manual",
    cliente_id: searchParams.get("cliente") ?? "",
  });

  useEffect(() => {
    api.get<Cliente[]>("/api/clientes").then(setClientes).catch(() => setClientes([]));
  }, []);

  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const vehiculo = await api.post<Vehiculo>("/api/vehiculos", {
        placa: form.placa.toUpperCase().trim(),
        marca: form.marca || null,
        modelo: form.modelo || null,
        anio: form.anio ? Number(form.anio) : null,
        color: form.color || null,
        vin_chasis: form.vin_chasis || null,
        kilometraje_actual: form.kilometraje_actual ? Number(form.kilometraje_actual) : null,
        tipo: form.tipo,
        combustible: form.combustible,
        transmision: form.transmision,
        cliente_id: Number(form.cliente_id),
      });
      router.push(`/vehiculos/${vehiculo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el vehículo.");
      setGuardando(false);
    }
  }

  return (
    <>
      <Link href="/vehiculos" className="inline-flex items-center gap-1.5 text-[0.93rem] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> Vehículos
      </Link>
      <PageHeader title="Registrar vehículo" description="Solo la placa y el propietario son obligatorios. El resto se puede completar después." />

      <form onSubmit={onSubmit} className="grid max-w-4xl gap-5 lg:grid-cols-[1fr_auto]">
        <Card className="space-y-5 p-5 md:p-6">
          <Field label="Propietario">
            <Select required value={form.cliente_id} onChange={set("cliente_id")} disabled={clientes === null}>
              <option value="">{clientes === null ? "Cargando clientes…" : "Elige un cliente"}</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {nombreCliente(c)}
                  {c.cedula_ruc ? ` · ${c.cedula_ruc}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          {clientes?.length === 0 && (
            <Alert tone="warn">
              Aún no hay clientes.{" "}
              <Link href="/clientes" className="font-semibold underline">
                Crea el cliente
              </Link>{" "}
              y vuelve a registrar el vehículo.
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Placa">
              <Input required value={form.placa} onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value.toUpperCase() }))} placeholder="ABC-1234" autoComplete="off" className="font-display text-xl font-semibold tracking-wider" />
            </Field>
            <Field label="Kilometraje actual">
              <Input type="number" min={0} inputMode="numeric" value={form.kilometraje_actual} onChange={set("kilometraje_actual")} />
            </Field>
            <Field label="Marca">
              <Input value={form.marca} onChange={set("marca")} placeholder="Toyota" />
            </Field>
            <Field label="Modelo">
              <Input value={form.modelo} onChange={set("modelo")} placeholder="Corolla" />
            </Field>
            <Field label="Año">
              <Input type="number" min={1950} max={2100} inputMode="numeric" value={form.anio} onChange={set("anio")} />
            </Field>
            <Field label="Color">
              <Input value={form.color} onChange={set("color")} />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onChange={set("tipo")}>
                <option value="auto">Auto</option>
                <option value="camioneta">Camioneta</option>
                <option value="suv">SUV</option>
                <option value="moto">Moto</option>
                <option value="camion">Camión</option>
              </Select>
            </Field>
            <Field label="Combustible">
              <Select value={form.combustible} onChange={set("combustible")}>
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diésel</option>
                <option value="hibrido">Híbrido</option>
                <option value="electrico">Eléctrico</option>
              </Select>
            </Field>
            <Field label="Transmisión">
              <Select value={form.transmision} onChange={set("transmision")}>
                <option value="manual">Manual</option>
                <option value="automatica">Automática</option>
              </Select>
            </Field>
            <Field label="VIN o chasis">
              <Input value={form.vin_chasis} onChange={set("vin_chasis")} autoComplete="off" />
            </Field>
          </div>

          {error && <Alert>{error}</Alert>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <ButtonLink href="/vehiculos" variant="ghost">
              Cancelar
            </ButtonLink>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Registrar vehículo"}
            </Button>
          </div>
        </Card>

        <div className="hidden lg:block">
          <Plate placa={form.placa.trim() || "ABC-1234"} size="lg" />
        </div>
      </form>
    </>
  );
}

export default function NuevoVehiculoPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <NuevoVehiculoForm />
    </Suspense>
  );
}
