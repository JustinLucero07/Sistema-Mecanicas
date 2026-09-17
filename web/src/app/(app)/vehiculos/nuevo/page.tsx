"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car, ArrowLeft, Check, Plus, AlertCircle } from "lucide-react";
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
    combustible: "gasolina",
    transmision: "manual",
    cliente_id: "",
  });

  useEffect(() => {
    api.get<Cliente[]>("/api/clientes").then(setClientes).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      setError("Selecciona el cliente propietario del vehículo");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const vehiculo = await api.post<Vehiculo>("/api/vehiculos", {
        placa: form.placa.toUpperCase().trim(),
        marca: form.marca || null,
        modelo: form.modelo || null,
        anio: form.anio ? Number(form.anio) : null,
        color: form.color || null,
        tipo: form.tipo || null,
        combustible: form.combustible || null,
        transmision: form.transmision || null,
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
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/vehiculos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a vehículos
      </Link>

      <div className="rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-6 shadow-2xl">
        <div className="border-b border-slate-800/80 pb-4">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-400" />
            Registrar Nuevo Vehículo
          </h1>
          <p className="text-xs text-slate-400">
            Ingresa las especificaciones del vehículo para asignarle su ficha y línea de tiempo clínica.
          </p>
        </div>

        {/* Live Plate Badge Preview */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Vista previa de placa:</span>
            <div className="mt-1">
              <span className="plate-badge px-3.5 py-1 text-xl font-black rounded">
                {form.placa || "ABC-1234"}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p className="font-semibold text-slate-200">
              {[form.marca, form.modelo, form.anio].filter(Boolean).join(" ") || "Vehículo sin datos"}
            </p>
            <p className="text-[11px] text-slate-500">
              {clientes.find((c) => String(c.id) === form.cliente_id)?.nombre || "Sin cliente"}
            </p>
          </div>
        </div>

        {clientes.length === 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <span>No hay clientes registrados en el taller todavía.</span>
            <Link href="/clientes" className="font-bold underline">
              Crear cliente primero
            </Link>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Cliente Propietario *</label>
            <select
              required
              value={form.cliente_id}
              onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.cedula_ruc ? `(${c.cedula_ruc})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Placa / Matrícula *</label>
              <input
                required
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm font-mono uppercase text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Marca</label>
              <input
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="Ej: Toyota"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Modelo</label>
              <input
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ej: Corolla"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Año de Fabricación</label>
              <input
                type="number"
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: e.target.value })}
                placeholder="Ej: 2020"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color</label>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Ej: Blanco Perla"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Combustible</label>
              <select
                value={form.combustible}
                onChange={(e) => setForm({ ...form, combustible: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diésel</option>
                <option value="hibrido">Híbrido</option>
                <option value="electrico">Eléctrico</option>
                <option value="glp">Gas GLP</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Transmisión</label>
              <select
                value={form.transmision}
                onChange={(e) => setForm({ ...form, transmision: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="manual">Manual / Mecánica</option>
                <option value="automatica">Automática</option>
                <option value="cvt">CVT</option>
                <option value="dual_clutch">Doble Embrague</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
          >
            {guardando ? "Registrando vehículo..." : "Guardar e Iniciar Historial Clínico"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NuevoVehiculoPage() {
  return (
    <Suspense fallback={<p className="text-slate-500 text-xs">Cargando formulario...</p>}>
      <NuevoVehiculoForm />
    </Suspense>
  );
}
