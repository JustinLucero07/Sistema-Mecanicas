"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  Calendar,
  Gauge,
  User,
  Wrench,
  Fuel,
  FileText,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowLeft,
  Phone,
  MessageSquare,
  ShieldCheck,
  Hash,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { TimelineEvento, Vehiculo } from "@/lib/types";
import { formatoMoneda } from "@/lib/format";
import FuelGauge from "@/components/FuelGauge";

type LineaNueva = { tipo: "mano_obra" | "repuesto"; descripcion: string; cantidad: string; precio_unitario: string };

export default function VehiculoDetalle({ vehiculoId }: { vehiculoId: number }) {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvento[]>([]);
  const [tabActiva, setTabActiva] = useState<"timeline" | "nueva_orden" | "fotos">("timeline");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario nueva orden
  const [motivo, setMotivo] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [nivelCombustible, setNivelCombustible] = useState(50);
  const [lineas, setLineas] = useState<LineaNueva[]>([
    { tipo: "mano_obra", descripcion: "Revisión general y diagnóstico", cantidad: "1", precio_unitario: "20" },
  ]);

  // Subida de fotos
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [tipoFoto, setTipoFoto] = useState("frente");

  function cargarDatos() {
    api
      .get<Vehiculo>(`/api/vehiculos/${vehiculoId}`)
      .then((v) => {
        setVehiculo(v);
        if (v.kilometraje_actual) setKilometraje(String(v.kilometraje_actual));
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Error al cargar el vehículo");
      });

    api
      .get<TimelineEvento[]>(`/api/vehiculos/${vehiculoId}/timeline`)
      .then(setTimeline)
      .catch(() => {});
  }

  useEffect(() => {
    cargarDatos();
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

  async function onSubmitOrden(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setGuardando(true);
    try {
      await api.post("/api/ordenes", {
        vehiculo_id: vehiculoId,
        motivo_ingreso: motivo || "Ingreso a taller",
        kilometraje_ingreso: kilometraje ? Number(kilometraje) : null,
        detalles: lineas
          .filter((l) => l.descripcion && l.precio_unitario)
          .map((l) => ({
            tipo: l.tipo,
            descripcion: l.descripcion,
            cantidad: Number(l.cantidad || "1"),
            precio_unitario: Number(l.precio_unitario),
          })),
        checklist: {
          nivel_combustible: nivelCombustible,
          radio: true,
          herramientas: true,
          gato_palanca: true,
          llanta_emergencia: true,
        },
      });
      setExito("Orden de trabajo creada e incorporada al historial clínico.");
      setTabActiva("timeline");
      cargarDatos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la orden");
    } finally {
      setGuardando(false);
    }
  }

  async function onSubirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      formData.append("tipo", tipoFoto);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/vehiculos/${vehiculoId}/fotos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir fotografía");
      setExito("Fotografía guardada con éxito en la galería de evidencias.");
      cargarDatos();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir foto");
    } finally {
      setSubiendoFoto(false);
    }
  }

  if (error && !vehiculo) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3">
        <p className="font-bold">{error}</p>
        <Link href="/vehiculos" className="text-xs text-orange-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al catálogo de vehículos
        </Link>
      </div>
    );
  }

  if (!vehiculo) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
        <div className="h-96 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
      </div>
    );
  }

  const enTaller = vehiculo.estado === "en_taller";
  const proximoKm = vehiculo.proximo_mantenimiento_km;
  const alertaMantenimiento =
    proximoKm && vehiculo.kilometraje_actual && vehiculo.kilometraje_actual >= proximoKm - 1000;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Botón Volver */}
      <div>
        <Link
          href="/vehiculos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al listado de vehículos
        </Link>
      </div>

      {/* Hero Cockpit del Vehículo */}
      <div className="rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Lado izquierdo: Placa, modelo, especificaciones */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="plate-badge px-4 py-1.5 text-2xl font-black rounded-lg shadow-md">
                {vehiculo.placa}
              </div>

              {enTaller ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  En Taller Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fuera de Taller
                </span>
              )}

              {alertaMantenimiento && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  ⚠️ Servicio Próximo
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(" ")}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {vehiculo.color && <span>Color: <strong className="text-slate-800 dark:text-slate-200">{vehiculo.color}</strong></span>}
              {vehiculo.tipo && <span>Tipo: <strong className="text-slate-800 dark:text-slate-200 capitalize">{vehiculo.tipo}</strong></span>}
              {vehiculo.combustible && <span>Combustible: <strong className="text-slate-800 dark:text-slate-200 capitalize">{vehiculo.combustible}</strong></span>}
              {vehiculo.transmision && <span>Transmisión: <strong className="text-slate-800 dark:text-slate-200 capitalize">{vehiculo.transmision}</strong></span>}
              {vehiculo.vin_chasis && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-orange-500" />
                  VIN: <strong className="font-mono text-slate-800 dark:text-slate-200">{vehiculo.vin_chasis}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Lado derecho: Odómetro y Propietario CRM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-orange-500" />
                Odómetro Registrado
              </span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {vehiculo.kilometraje_actual ? `${vehiculo.kilometraje_actual.toLocaleString()} km` : "No registrado"}
              </p>
              {proximoKm && (
                <p className="text-[11px] text-slate-400">
                  Próximo servicio: <span className="font-mono font-semibold text-slate-300">{proximoKm.toLocaleString()} km</span>
                </p>
              )}
            </div>

            <div className="sm:border-l sm:border-slate-800 sm:pl-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                Propietario
              </span>
              <p className="text-sm font-bold text-slate-100 truncate">
                {vehiculo.cliente?.nombre_completo || vehiculo.cliente?.nombre || "—"}
              </p>
              {vehiculo.cliente?.telefono && (
                <a
                  href={`https://wa.me/${vehiculo.cliente.telefono.replace(/\D/g, "")}?text=Estimado%20${encodeURIComponent(vehiculo.cliente.nombre)},%20le%20escribimos%20de%20MecánicaOS%20sobre%20su%20vehículo%20${encodeURIComponent(vehiculo.placa)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline pt-0.5"
                >
                  <MessageSquare className="w-3 h-3" />
                  WhatsApp ({vehiculo.cliente.telefono})
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-800/80 pt-4">
          <button
            onClick={() => setTabActiva("timeline")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tabActiva === "timeline"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Historial Clínico ({timeline.length})
          </button>
          <button
            onClick={() => setTabActiva("nueva_orden")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tabActiva === "nueva_orden"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/30"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + Nueva Orden de Trabajo (Check-in)
          </button>
          <button
            onClick={() => setTabActiva("fotos")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tabActiva === "fotos"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Evidencias Fotográficas ({vehiculo.fotos?.length || 0})
          </button>
        </div>
      </div>

      {exito && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {exito}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* PESTAÑA: HISTORIAL / TIMELINE */}
      {tabActiva === "timeline" && (
        <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                Línea de Tiempo Inmutable del Vehículo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro histórico completo de intervenciones, diagnósticos, piezas instaladas y auditoría.
              </p>
            </div>
            <button
              onClick={cargarDatos}
              className="text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              ↻ Refrescar
            </button>
          </div>

          {timeline.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Wrench className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">Sin órdenes ni intervenciones previas</p>
              <p className="text-xs max-w-sm mx-auto">
                Crea una nueva orden de trabajo con el botón superior para inaugurar el historial clínico de este vehículo.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pl-6">
              {timeline.map((evento) => (
                <div key={evento.orden_id} className="relative group">
                  {/* Nodo Iluminado */}
                  <span className="absolute -left-[31px] top-2 w-4 h-4 rounded-full border-2 border-[#0b0f19] bg-orange-500 shadow-[0_0_10px_#f97316] group-hover:scale-125 transition-transform" />

                  <div className="rounded-2xl glass-card border border-slate-800/80 p-5 space-y-4 hover:border-slate-700 transition-all shadow-md">
                    {/* Header Evento */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-slate-950 text-orange-400 border border-slate-800">
                          OT #{evento.numero_orden || evento.orden_id}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                          {evento.estado.replace("_", " ")}
                        </span>
                        {evento.kilometraje && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {evento.kilometraje.toLocaleString()} km
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-400">
                          {new Date(evento.fecha).toLocaleDateString("es-EC", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {formatoMoneda(evento.costo_total)}
                        </span>
                      </div>
                    </div>

                    {/* Contenido Técnico */}
                    <div className="space-y-3 text-xs">
                      {evento.motivo && (
                        <div>
                          <span className="text-slate-500 font-semibold uppercase text-[10px]">Motivo de Ingreso:</span>
                          <p className="text-slate-200 mt-0.5">{evento.motivo}</p>
                        </div>
                      )}

                      {evento.diagnostico && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <span className="font-bold text-[11px] uppercase tracking-wider block mb-1">
                            Diagnóstico Técnico:
                          </span>
                          <p>{evento.diagnostico}</p>
                        </div>
                      )}

                      {evento.repuestos_utilizados && evento.repuestos_utilizados.length > 0 && (
                        <div>
                          <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-1.5">
                            Repuestos e Insumos Instalados:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {evento.repuestos_utilizados.map((rep, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px] flex items-center gap-1.5"
                              >
                                <Wrench className="w-3 h-3 text-orange-400" />
                                {rep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-slate-400 pt-2 border-t border-slate-900 text-[11px]">
                        <span>Mecánico Responsable: <strong className="text-slate-200">{evento.mecanico_nombre || "Sin asignar"}</strong></span>
                        {evento.observaciones && <span>Nota: {evento.observaciones}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: NUEVA ORDEN DE TRABAJO */}
      {tabActiva === "nueva_orden" && (
        <form onSubmit={onSubmitOrden} className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              Check-in de Patio & Registro de Orden
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra el motivo de ingreso, kilometraje verificado y presupuesto inicial de mano de obra y repuestos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Motivo de Ingreso / Síntomas reportados por el cliente
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Sonido metálico en frenos delanteros, revisión de suspensión, cambio de kit de embrague..."
                rows={2}
                required
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Kilometraje de Ingreso (km)
              </label>
              <input
                type="number"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                placeholder="Ej: 120500"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
              {vehiculo.kilometraje_actual && Number(kilometraje) < vehiculo.kilometraje_actual && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  ⚠️ El kilometraje indicado es menor al registrado previamente ({vehiculo.kilometraje_actual} km).
                </p>
              )}
            </div>

            <FuelGauge
              level={nivelCombustible}
              onChange={setNivelCombustible}
              interactive={true}
            />
          </div>

          {/* Líneas de Mano de Obra y Repuestos */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Mano de Obra y Repuestos Presupuestados
            </label>

            <div className="space-y-2">
              {lineas.map((linea, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
                >
                  <select
                    value={linea.tipo}
                    onChange={(e) => actualizarLinea(idx, "tipo", e.target.value as any)}
                    className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="mano_obra">Mano de Obra</option>
                    <option value="repuesto">Repuesto</option>
                  </select>

                  <input
                    type="text"
                    value={linea.descripcion}
                    onChange={(e) => actualizarLinea(idx, "descripcion", e.target.value)}
                    placeholder="Descripción del trabajo o repuesto"
                    required
                    className="flex-1 min-w-[14rem] rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                  />

                  <input
                    type="number"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)}
                    placeholder="Cant."
                    className="w-16 rounded-lg bg-slate-900/60 border border-slate-800 px-2 py-1.5 text-xs text-center text-slate-200 focus:outline-none focus:border-orange-500"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={linea.precio_unitario}
                    onChange={(e) => actualizarLinea(idx, "precio_unitario", e.target.value)}
                    placeholder="Precio"
                    required
                    className="w-24 rounded-lg bg-slate-900/60 border border-slate-800 px-2 py-1.5 text-xs text-right text-slate-200 focus:outline-none focus:border-orange-500"
                  />

                  <button
                    type="button"
                    onClick={() => quitarLinea(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar otra línea de trabajo o repuesto
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setTabActiva("timeline")}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
            >
              {guardando ? "Creando orden..." : "Registrar Orden y Check-in"}
            </button>
          </div>
        </form>
      )}

      {/* PESTAÑA: GALERÍA Y FOTOS */}
      {tabActiva === "fotos" && (
        <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-500" />
                Evidencias Fotográficas de Taller
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro de carrocería, daños preexistentes, proceso mecánico y entrega protegida.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={tipoFoto}
                onChange={(e) => setTipoFoto(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="frente">Frente</option>
                <option value="parte_trasera">Parte Trasera</option>
                <option value="lateral_izquierdo">Lateral Izquierdo</option>
                <option value="lateral_derecho">Lateral Derecho</option>
                <option value="interior">Interior</option>
                <option value="motor">Motor</option>
                <option value="danio">Daño / Rayón</option>
                <option value="placa">Placa</option>
              </select>

              <label className="cursor-pointer px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all inline-flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" />
                {subiendoFoto ? "Subiendo..." : "Subir Foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSubirFoto}
                  disabled={subiendoFoto}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {!vehiculo.fotos || vehiculo.fotos.length === 0 ? (
            <div className="py-16 text-center text-slate-500 rounded-xl border border-dashed border-slate-800 space-y-2">
              <Camera className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">Sin fotografías de evidencia</p>
              <p className="text-xs max-w-sm mx-auto">
                Selecciona una categoría arriba y sube fotos del estado de carrocería o motor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {vehiculo.fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="group relative rounded-2xl overflow-hidden glass-card border border-slate-800 shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt={foto.tipo}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 capitalize">
                      {foto.tipo.replace("_", " ")}
                    </span>
                    {foto.creado_en && (
                      <span className="text-[10px] text-slate-500">
                        {new Date(foto.creado_en).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
