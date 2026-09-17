"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Scale,
  CreditCard,
  AlertTriangle,
  Car,
  Plus,
  ArrowUpRight,
  Package,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { DashboardFinanciero, EgresoPorCategoria } from "@/lib/types";
import StatCard from "@/components/StatCard";
import WorkshopKanban from "@/components/WorkshopKanban";
import { formatoMoneda, formatoPct, nombreMes } from "@/lib/format";

const COLORES_PIE = [
  "#f97316", // Naranja
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#10b981", // Esmeralda
  "#a855f7", // Púrpura
  "#ec4899", // Rosa
  "#eab308", // Amarillo
  "#64748b", // Slate
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardFinanciero | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardFinanciero>("/api/reportes/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar el dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300">
        <p className="font-bold">No se pudo cargar el dashboard</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
      </div>
    );
  }

  const resumen = data.resumen_mes_actual;
  const tendencia = data.tendencia_12_meses.map((p) => ({
    ...p,
    etiqueta: `${nombreMes(p.mes).slice(0, 3)} ${p.anio}`,
  }));

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Dashboard Operativo & Financiero
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {nombreMes(resumen.mes)} {resumen.anio}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Métricas de rendimiento en tiempo real, flujo de caja y vehículos en taller
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/vehiculos"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <Car className="w-3.5 h-3.5 text-orange-500" />
            Vehículos
          </Link>
          <Link
            href="/clientes"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Cliente
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos del Mes"
          value={formatoMoneda(resumen.ingresos_total)}
          hint={`${formatoPct(resumen.variacion_ingresos_pct)} vs. mes anterior`}
          tone="positive"
          icon={DollarSign}
        />
        <StatCard
          label="Egresos del Mes"
          value={formatoMoneda(resumen.egresos_total)}
          hint={`${formatoPct(resumen.variacion_egresos_pct)} vs. mes anterior`}
          tone="negative"
          icon={Receipt}
        />
        <StatCard
          label="Utilidad Neta (Balance)"
          value={formatoMoneda(resumen.balance_neto)}
          hint={`${formatoPct(resumen.variacion_balance_pct)} vs. mes anterior`}
          tone={resumen.balance_neto >= 0 ? "positive" : "negative"}
          icon={Scale}
        />
        <StatCard
          label="Por Cobrar / Por Pagar"
          value={formatoMoneda(data.cuentas_por_cobrar_total)}
          subValue={`/ ${formatoMoneda(data.cuentas_por_pagar_total)}`}
          hint="Cuentas pendientes"
          tone="warning"
          icon={CreditCard}
        />
      </div>

      {/* Sección de Gráficos Analíticos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de Tendencia 12 Meses con Gradientes Suavizados */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800/80 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Flujo de Caja — Tendencia Histórica (12 Meses)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparativa de ingresos, costos operativos y rentabilidad</p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
              USD ($)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendencia}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="etiqueta" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(11, 15, 25, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#f1f5f9",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                  }}
                  formatter={(value) => [formatoMoneda(Number(value)), ""]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="ingresos_total"
                  name="Ingresos"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                />
                <Area
                  type="monotone"
                  dataKey="egresos_total"
                  name="Egresos"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEgresos)"
                />
                <Area
                  type="monotone"
                  dataKey="balance_neto"
                  name="Utilidad Neta"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Egresos por Categoría (Donut Chart) */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-200 dark:border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Distribución de Gastos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Egresos categorizados del mes en curso</p>
          </div>

          {data.egresos_por_categoria.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-8">
              <Receipt className="w-8 h-8 mb-2 text-slate-600" />
              <span>Sin egresos registrados este mes</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.egresos_por_categoria}
                    dataKey="total"
                    nameKey="categoria"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.egresos_por_categoria.map((entry, i) => (
                      <Cell key={entry.categoria} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(11, 15, 25, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                    }}
                    formatter={(value) => formatoMoneda(Number(value))}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    formatter={(value) => {
                      const item = data.egresos_por_categoria.find((e) => e.categoria === value);
                      return (
                        <span className="text-slate-300 capitalize">
                          {value.replace("_", " ")} {item ? `(${item.porcentaje}%)` : ""}
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Gastos Mes:</span>
            <span className="font-mono font-bold text-slate-200">
              {formatoMoneda(resumen.egresos_total)}
            </span>
          </div>
        </div>
      </div>

      {/* Patio de Taller en Vivo (Kanban de Bahías) */}
      <WorkshopKanban />

      {/* Alerta de Repuestos Críticos */}
      {data.repuestos_bajo_stock.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-sm font-bold">Repuestos con Stock Bajo ({data.repuestos_bajo_stock.length})</h2>
            </div>
            <Link
              href="/inventario"
              className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
            >
              Ir a Inventario <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.repuestos_bajo_stock.map((r) => (
              <div
                key={r.repuesto_id}
                className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 text-xs flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-200 truncate">{r.nombre}</p>
                  <p className="text-[11px] text-amber-400/90">Mínimo sugerido: {r.stock_minimo}</p>
                </div>
                <span className="font-mono font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 shrink-0">
                  {r.stock_actual} uds
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
