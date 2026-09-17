"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Camera,
  Plus,
  Search,
  Gauge,
  User,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Vehiculo } from "@/lib/types";
import ScannerModal from "@/components/ScannerModal";

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "en_taller" | "activo" | "alerta">("todos");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  function cargar(query?: string) {
    setLoading(true);
    api
      .get<Vehiculo[]>(`/api/vehiculos${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then(setVehiculos)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar vehículos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    cargar(q);
  }

  const vehiculosFiltrados = vehiculos.filter((v) => {
    if (filtroEstado === "en_taller") return v.estado === "en_taller";
    if (filtroEstado === "activo") return v.estado === "activo" || !v.estado;
    if (filtroEstado === "alerta") {
      return (
        v.proximo_mantenimiento_km &&
        v.kilometraje_actual &&
        v.kilometraje_actual >= v.proximo_mantenimiento_km - 1000
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-orange-500" />
            Parque Automotor & Historial Clínico
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ficha técnica, odómetro inteligente y trazabilidad completa por placa
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Escanear Placa (LPR)
          </button>
          <Link
            href="/vehiculos/nuevo"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Registrar Vehículo
          </Link>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80">
        <form onSubmit={onBuscar} className="w-full sm:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por placa, VIN, marca o cliente..."
            className="w-full rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-9 pr-20 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-transparent"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
          {[
            { id: "todos", label: `Todos (${vehiculos.length})` },
            { id: "en_taller", label: "En Taller" },
            { id: "activo", label: "Fuera de Taller" },
            { id: "alerta", label: "⚠️ Alerta Servicio" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroEstado(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                filtroEstado === f.id
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-semibold"
                  : "bg-slate-100 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Grid de Vehículos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : vehiculosFiltrados.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel border border-dashed border-slate-800 space-y-3">
          <Car className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-base font-bold text-slate-300">No se encontraron vehículos</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {q ? "Ningún vehículo coincide con el criterio de búsqueda." : "Registra el primer vehículo o escanea una placa para comenzar."}
          </p>
          <button
            onClick={() => setScannerOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all"
          >
            <Camera className="w-4 h-4" /> Escanear Placa Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiculosFiltrados.map((v) => {
            const enTaller = v.estado === "en_taller";
            const proximoKm = v.proximo_mantenimiento_km;
            const alertaMantenimiento =
              proximoKm && v.kilometraje_actual && v.kilometraje_actual >= proximoKm - 1000;

            return (
              <div
                key={v.id}
                onClick={() => router.push(`/vehiculos/${v.id}`)}
                className="group relative rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col justify-between space-y-4 hover:border-orange-500/50 dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                {/* Cabecera Tarjeta: Placa y Estado */}
                <div className="flex items-start justify-between gap-3">
                  <div className="plate-badge px-3 py-1 text-base font-black rounded shadow-sm">
                    {v.placa}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {enTaller ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        En Taller
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Activo
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Principal */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                    {[v.marca, v.modelo, v.anio].filter(Boolean).join(" ")}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {v.color && <span>Color: {v.color}</span>}
                    {v.combustible && <span className="capitalize">• {v.combustible}</span>}
                    {v.transmision && <span className="capitalize">• {v.transmision}</span>}
                  </div>
                </div>

                {/* Odómetro y Mantenimiento */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Gauge className="w-3.5 h-3.5 text-orange-500" />
                      Odómetro:
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                      {v.kilometraje_actual ? `${v.kilometraje_actual.toLocaleString()} km` : "No registrado"}
                    </span>
                  </div>

                  {proximoKm && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-900">
                      <span className="text-slate-500">Próximo servicio:</span>
                      <span className={`font-mono ${alertaMantenimiento ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                        {proximoKm.toLocaleString()} km
                      </span>
                    </div>
                  )}

                  {alertaMantenimiento && (
                    <div className="p-1.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Mantenimiento requerido próximamente
                    </div>
                  )}
                </div>

                {/* Propietario Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-300 font-medium truncate">
                      {v.cliente?.nombre_completo || v.cliente?.nombre || "Sin propietario"}
                    </span>
                  </div>

                  <span className="text-orange-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Escaneo */}
      <ScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
