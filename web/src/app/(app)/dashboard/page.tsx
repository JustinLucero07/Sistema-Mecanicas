"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import type { DashboardFinanciero, EgresoPorCategoria } from "@/lib/types";
import StatCard from "@/components/StatCard";
import { formatoMoneda, formatoPct, nombreMes } from "@/lib/format";

const COLORES = ["#0f172a", "#f97316", "#0ea5e9", "#22c55e", "#a855f7", "#ef4444", "#eab308", "#64748b"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardFinanciero | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardFinanciero>("/api/reportes/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar el dashboard"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Cargando dashboard...</p>;

  const resumen = data.resumen_mes_actual;
  const tendencia = data.tendencia_12_meses.map((p) => ({
    ...p,
    etiqueta: `${nombreMes(p.mes)} ${p.anio}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Dashboard — {nombreMes(resumen.mes)} {resumen.anio}
        </h1>
        <p className="text-sm text-slate-500">Resumen financiero del mes en curso vs. el anterior</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos del mes"
          value={formatoMoneda(resumen.ingresos_total)}
          hint={`${formatoPct(resumen.variacion_ingresos_pct)} vs. mes anterior`}
          tone="positive"
        />
        <StatCard
          label="Egresos del mes"
          value={formatoMoneda(resumen.egresos_total)}
          hint={`${formatoPct(resumen.variacion_egresos_pct)} vs. mes anterior`}
          tone="negative"
        />
        <StatCard
          label="Balance neto"
          value={formatoMoneda(resumen.balance_neto)}
          hint={`${formatoPct(resumen.variacion_balance_pct)} vs. mes anterior`}
          tone={resumen.balance_neto >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Por cobrar / por pagar"
          value={`${formatoMoneda(data.cuentas_por_cobrar_total)} / ${formatoMoneda(data.cuentas_por_pagar_total)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-slate-700">Tendencia — últimos 12 meses</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatoMoneda(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="ingresos_total" name="Ingresos" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="egresos_total" name="Egresos" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="balance_neto" name="Balance" stroke="#0f172a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-slate-700">Egresos por categoría (mes actual)</h2>
          {data.egresos_por_categoria.length === 0 ? (
            <p className="text-sm text-slate-400">Sin egresos registrados este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.egresos_por_categoria}
                  dataKey="total"
                  nameKey="categoria"
                  outerRadius={90}
                  label={(entry: unknown) => {
                    const e = entry as EgresoPorCategoria;
                    return `${e.categoria} (${e.porcentaje}%)`;
                  }}
                >
                  {data.egresos_por_categoria.map((entry, i) => (
                    <Cell key={entry.categoria} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatoMoneda(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {data.repuestos_bajo_stock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-medium text-amber-800">Repuestos con stock bajo</h2>
          <ul className="space-y-1 text-sm text-amber-700">
            {data.repuestos_bajo_stock.map((r) => (
              <li key={r.repuesto_id}>
                {r.nombre}: {r.stock_actual} unidades (mínimo {r.stock_minimo})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
