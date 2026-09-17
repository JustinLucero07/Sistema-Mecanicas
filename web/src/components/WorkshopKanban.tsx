"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, CheckCircle2, Clock, Eye, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { OrdenTrabajo } from "@/lib/types";

export default function WorkshopKanban() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<OrdenTrabajo[]>("/api/ordenes")
      .then((data) => {
        // Filtrar órdenes que no estén canceladas ni entregadas
        setOrdenes(
          data.filter((o) => !["entregado", "cancelado"].includes(o.estado?.toLowerCase() || ""))
        );
      })
      .catch(() => {
        // Si hay error de red, dejamos vacío
        setOrdenes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const columnas = [
    {
      id: "recepcion",
      title: "Recepción & Diagnóstico",
      icon: Eye,
      estados: ["recepcion", "diagnostico", "esperando_aprobacion", "pendiente"],
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      id: "reparacion",
      title: "En Reparación / Bahías",
      icon: Wrench,
      estados: ["en_reparacion", "esperando_repuestos"],
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    {
      id: "calidad",
      title: "Control de Calidad",
      icon: Clock,
      estados: ["control_calidad"],
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      id: "listo",
      title: "Listo para Entrega",
      icon: CheckCircle2,
      estados: ["listo_para_entregar"],
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Patio de Taller en Vivo — Órdenes en Curso
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estado operativo y avance de vehículos en bahías</p>
        </div>
        <Link
          href="/vehiculos"
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
        >
          Ver todos los vehículos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columnas.map((col) => {
          const itemsColumna = ordenes.filter((o) =>
            col.estados.includes(o.estado?.toLowerCase() || "")
          );
          const IconComponent = col.icon;

          return (
            <div
              key={col.id}
              className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 p-4 flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${col.badgeColor}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{col.title}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                  {itemsColumna.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 min-h-[140px]">
                {loading ? (
                  <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-900/40 animate-pulse border border-slate-200 dark:border-slate-800/40" />
                ) : itemsColumna.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 text-xs">
                    <span>Sin vehículos en esta fase</span>
                  </div>
                ) : (
                  itemsColumna.map((orden) => (
                    <Link
                      key={orden.id}
                      href={`/vehiculos/${orden.vehiculo_id}`}
                      className="block p-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-orange-500/50 dark:hover:border-slate-700 transition-all hover:translate-y-[-1px] space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="plate-badge px-2 py-0.5 text-xs font-bold rounded">
                          {orden.vehiculo?.placa || "S/P"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          OT #{orden.numero_orden || orden.id}
                        </span>
                      </div>

                      <div className="text-xs">
                        <p className="font-semibold text-slate-900 dark:text-slate-200 truncate">
                          {[orden.vehiculo?.marca, orden.vehiculo?.modelo].filter(Boolean).join(" ") || "Vehículo"}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                          {orden.cliente?.nombre || "Cliente"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-900">
                        <span className="truncate max-w-[120px]">
                          {orden.mecanico?.nombre ? `🔧 ${orden.mecanico.nombre}` : "Sin mecánico"}
                        </span>
                        {orden.prioridad === "urgente" && (
                          <span className="text-red-500 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Urgente
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
