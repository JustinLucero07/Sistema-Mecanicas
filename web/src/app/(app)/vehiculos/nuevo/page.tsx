"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Cliente, Vehiculo } from "@/lib/types";

function NuevoVehiculoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    placa: searchParams.get("placa") ?? "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    tipo: "auto",
    cliente_id: "",
  });

  useEffect(() => {
    api.get<Cliente[]>("/api/clientes").then(setClientes).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      setError("Selecciona el cliente dueño del vehículo");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const vehiculo = await api.post<Vehiculo>("/api/vehiculos", {
        placa: form.placa,
        marca: form.marca || null,
        modelo: form.modelo || null,
        anio: form.anio ? Number(form.anio) : null,
        color: form.color || null,
        tipo: form.tipo || null,
        cliente_id: Number(form.cliente_id),
      });
      router.push(`/vehiculos/${vehiculo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el vehículo");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Nuevo vehículo</h1>

      {clientes.length === 0 && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Todavía no hay clientes registrados.{" "}
          <a className="underline" href="/clientes">
            Crea uno primero
          </a>
          .
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <select
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Placa</label>
            <input
              required
              value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="ABC-1234"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Marca</label>
            <input
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Modelo</label>
            <input
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Año</label>
            <input
              type="number"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Color</label>
            <input
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar vehículo"}
        </button>
      </form>
    </div>
  );
}

export default function NuevoVehiculoPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Cargando...</p>}>
      <NuevoVehiculoForm />
    </Suspense>
  );
}
