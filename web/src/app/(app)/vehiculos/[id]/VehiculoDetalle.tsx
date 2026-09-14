"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { DetalleOrden, OrdenTrabajo, Vehiculo } from "@/lib/types";
import { formatoMoneda } from "@/lib/format";

type LineaNueva = { tipo: "mano_obra" | "repuesto"; descripcion: string; cantidad: string; precio_unitario: string };

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completado: "Completado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function VehiculoDetalle({ vehiculoId }: { vehiculoId: number }) {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [descripcionProblema, setDescripcionProblema] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [lineas, setLineas] = useState<LineaNueva[]>([
    { tipo: "mano_obra", descripcion: "", cantidad: "1", precio_unitario: "" },
  ]);

  function cargarTodo() {
    api.get<Vehiculo>(`/api/vehiculos/${vehiculoId}`).then(setVehiculo).catch((err) => {
      setError(err instanceof ApiError ? err.message : "Error al cargar el vehículo");
    });
    api
      .get<OrdenTrabajo[]>(`/api/ordenes?vehiculo_id=${vehiculoId}`)
      .then(setOrdenes)
      .catch(() => {});
  }

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId]);

  function actualizarLinea(idx: number, campo: keyof LineaNueva, valor: string) {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { tipo: "mano_obra", descripcion: "", cantidad: "1", precio_unitario: "" }]);
  }

  function quitarLinea(idx: number) {
    setLineas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await api.post<OrdenTrabajo>("/api/ordenes", {
        vehiculo_id: vehiculoId,
        fecha_ingreso: new Date().toISOString(),
        kilometraje_ingreso: kilometraje ? Number(kilometraje) : null,
        descripcion_problema: descripcionProblema || null,
        detalles: lineas
          .filter((l) => l.descripcion && l.precio_unitario)
          .map((l) => ({
            tipo: l.tipo,
            descripcion: l.descripcion,
            cantidad: Number(l.cantidad || "1"),
            precio_unitario: Number(l.precio_unitario),
          })),
      });
      setMostrarForm(false);
      setDescripcionProblema("");
      setKilometraje("");
      setLineas([{ tipo: "mano_obra", descripcion: "", cantidad: "1", precio_unitario: "" }]);
      cargarTodo();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la orden");
    } finally {
      setGuardando(false);
    }
  }

  if (error && !vehiculo) return <p className="text-red-600">{error}</p>;
  if (!vehiculo) return <p className="text-slate-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{vehiculo.placa}</h1>
            <p className="text-slate-600">
              {[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(" · ") || "Sin datos de marca/modelo"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Dueño: {vehiculo.cliente?.nombre ?? "—"} · {vehiculo.cliente?.telefono ?? ""}
            </p>
            {vehiculo.kilometraje_actual && (
              <p className="text-sm text-slate-500">Kilometraje actual: {vehiculo.kilometraje_actual} km</p>
            )}
          </div>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {mostrarForm ? "Cancelar" : "+ Nueva entrada de mantenimiento"}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Nueva orden de trabajo</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Descripción del problema</label>
              <textarea
                value={descripcionProblema}
                onChange={(e) => setDescripcionProblema(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kilometraje de ingreso</label>
              <input
                type="number"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Trabajos y repuestos</label>
            {lineas.map((linea, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <select
                  value={linea.tipo}
                  onChange={(e) => actualizarLinea(idx, "tipo", e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-2 text-sm"
                >
                  <option value="mano_obra">Mano de obra</option>
                  <option value="repuesto">Repuesto</option>
                </select>
                <input
                  placeholder="Descripción"
                  value={linea.descripcion}
                  onChange={(e) => actualizarLinea(idx, "descripcion", e.target.value)}
                  className="min-w-[10rem] flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Cant."
                  value={linea.cantidad}
                  onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)}
                  className="w-20 rounded-md border border-slate-300 px-2 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={linea.precio_unitario}
                  onChange={(e) => actualizarLinea(idx, "precio_unitario", e.target.value)}
                  className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => quitarLinea(idx)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
            <button type="button" onClick={agregarLinea} className="text-sm text-slate-600 hover:underline">
              + Agregar línea
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar orden"}
          </button>
        </form>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de mantenimiento</h2>
        {ordenes.length === 0 ? (
          <p className="text-sm text-slate-400">Este vehículo todavía no tiene órdenes registradas.</p>
        ) : (
          <div className="space-y-3">
            {ordenes.map((orden) => (
              <OrdenCard key={orden.id} orden={orden} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdenCard({ orden }: { orden: OrdenTrabajo }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-slate-900">
            {new Date(orden.fecha_ingreso).toLocaleDateString("es-EC", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {ESTADO_LABEL[orden.estado] ?? orden.estado}
          </span>
        </div>
        <span className="text-sm font-semibold text-slate-900">{formatoMoneda(orden.total)}</span>
      </div>
      {orden.descripcion_problema && (
        <p className="mt-2 text-sm text-slate-600">{orden.descripcion_problema}</p>
      )}
      {orden.detalles.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-slate-500">
          {orden.detalles.map((d: DetalleOrden) => (
            <li key={d.id} className="flex justify-between">
              <span>
                {d.descripcion} ({d.cantidad}x)
              </span>
              <span>{formatoMoneda(d.subtotal)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
