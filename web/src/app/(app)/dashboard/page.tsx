"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CarFront, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { etiqueta, formatoMoneda, formatoPct, nombreMes } from "@/lib/format";
import type { DashboardFinanciero, OrdenTrabajo } from "@/lib/types";
import { puedeVerFinanzas } from "@/components/ProtectedShell";
import WorkshopBoard from "@/components/WorkshopBoard";
import { Alert, ButtonLink, Card, CardHeader, EmptyState, PageHeader, Skeleton, cn } from "@/components/ui";

const CERRADAS = ["entregado", "cancelado"];

function Cifra({ label, value, nota, tonoNota }: { label: string; value: string; nota?: string | null; tonoNota?: "ok" | "bad" }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[0.87rem] text-ink-3">{label}</p>
      <p className="mt-1 font-display text-[2.1rem] leading-none font-semibold text-ink">{value}</p>
      {nota && (
        <p className={cn("mt-1.5 text-[0.8rem]", tonoNota === "ok" ? "text-ok" : tonoNota === "bad" ? "text-bad" : "text-ink-3")}>{nota}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { sesion } = useAuth();
  const verFinanzas = puedeVerFinanzas(sesion?.rol);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[] | null>(null);
  const [finanzas, setFinanzas] = useState<DashboardFinanciero | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<OrdenTrabajo[]>("/api/ordenes")
      .then(setOrdenes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el taller. Revisa la conexión con el servidor."));
    if (verFinanzas) api.get<DashboardFinanciero>("/api/reportes/dashboard").then(setFinanzas).catch(() => {});
  }, [verFinanzas]);

  const activas = ordenes?.filter((o) => !CERRADAS.includes(o.estado)) ?? [];
  const listas = activas.filter((o) => ["listo_para_entregar", "completado"].includes(o.estado)).length;
  const enEspera = activas.filter((o) => ["esperando_aprobacion", "esperando_repuestos"].includes(o.estado)).length;
  const hoy = new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });

  const resumen = finanzas?.resumen_mes_actual;
  const tendencia = finanzas?.tendencia_12_meses.map((p) => ({ ...p, mes: `${nombreMes(p.mes)} ${String(p.anio).slice(2)}` })) ?? [];
  const hayMovimientos = tendencia.some((p) => p.ingresos_total > 0 || p.egresos_total > 0);
  const varIngresos = resumen ? formatoPct(resumen.variacion_ingresos_pct) : null;

  return (
    <>
      <PageHeader
        title="Hoy en el taller"
        description={etiqueta(hoy)}
        actions={
          <>
            <ButtonLink href="/clientes" variant="secondary" icon={Plus}>
              Nuevo cliente
            </ButtonLink>
            <ButtonLink href="/vehiculos" icon={CarFront}>
              Recibir vehículo
            </ButtonLink>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      {ordenes === null && !error ? (
        <Skeleton className="h-24" />
      ) : (
        <Card className="grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4 [&>*]:bg-surface">
          <Cifra label="Vehículos en el taller" value={String(activas.length)} />
          <Cifra label="Listos para entregar" value={String(listas)} nota={enEspera > 0 ? `${enEspera} en espera de aprobación o repuestos` : null} />
          {resumen ? (
            <>
              <Cifra
                label={`Ingresos de ${new Date(resumen.anio, resumen.mes - 1).toLocaleDateString("es-EC", { month: "long" })}`}
                value={formatoMoneda(resumen.ingresos_total)}
                nota={varIngresos ? `${varIngresos} frente al mes anterior` : "Sin datos del mes anterior"}
                tonoNota={varIngresos ? ((resumen.variacion_ingresos_pct ?? 0) >= 0 ? "ok" : "bad") : undefined}
              />
              <Cifra label="Por cobrar a clientes" value={formatoMoneda(finanzas?.cuentas_por_cobrar_total)} nota={`Por pagar a proveedores: ${formatoMoneda(finanzas?.cuentas_por_pagar_total)}`} />
            </>
          ) : (
            <>
              <Cifra label="En espera" value={String(enEspera)} nota="Aprobación del cliente o repuestos" />
              <Cifra label="Órdenes entregadas" value={String(ordenes?.filter((o) => o.estado === "entregado").length ?? 0)} />
            </>
          )}
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold">Vehículos en proceso</h2>
          <Link href="/ordenes" className="text-[0.93rem] font-semibold text-brand-text hover:underline">
            Ver todas las órdenes
          </Link>
        </div>
        {ordenes === null ? (
          <Skeleton className="h-64" />
        ) : activas.length === 0 ? (
          <Card>
            <EmptyState icon={CarFront} title="No hay vehículos en el taller" description="Cuando recibas un vehículo y le abras una orden, aparecerá aquí con su estado.">
              <ButtonLink href="/vehiculos">Recibir vehículo</ButtonLink>
            </EmptyState>
          </Card>
        ) : (
          <WorkshopBoard ordenes={activas} />
        )}
      </section>

      {finanzas && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Ingresos y egresos" description="Últimos 12 meses, en dólares" />
            <div className="p-5">
              {hayMovimientos ? (
                <>
                  <div className="mb-3 flex gap-5 text-[0.87rem] text-ink-2">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-brand" /> Ingresos
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-signal" /> Egresos
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={tendencia} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--ink-3)" }} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
                      <YAxis tick={{ fontSize: 12, fill: "var(--ink-3)" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value) => formatoMoneda(Number(value))}
                        contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }}
                        labelStyle={{ color: "var(--ink-3)" }}
                      />
                      <Area type="monotone" dataKey="ingresos_total" name="Ingresos" stroke="var(--brand)" strokeWidth={2} fill="var(--brand)" fillOpacity={0.12} />
                      <Area type="monotone" dataKey="egresos_total" name="Egresos" stroke="var(--signal)" strokeWidth={2} fill="var(--signal)" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="py-10 text-center text-ink-3">Aún no hay ingresos ni egresos registrados.</p>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader title="En qué se gastó este mes" />
              <div className="space-y-3 p-5">
                {finanzas.egresos_por_categoria.length === 0 && <p className="text-ink-3">Sin egresos este mes.</p>}
                {finanzas.egresos_por_categoria.map((e) => (
                  <div key={e.categoria}>
                    <div className="flex justify-between text-[0.93rem]">
                      <span className="text-ink-2">{etiqueta(e.categoria)}</span>
                      <span className="font-semibold">{formatoMoneda(e.total)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-raised">
                      <div className="h-full rounded-full bg-signal" style={{ width: `${Math.max(e.porcentaje, 3)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {finanzas.repuestos_bajo_stock.length > 0 && (
              <Card>
                <CardHeader
                  title="Repuestos por reponer"
                  action={
                    <Link href="/inventario" className="text-[0.87rem] font-semibold text-brand-text hover:underline">
                      Ir a inventario
                    </Link>
                  }
                />
                <ul className="divide-y divide-line">
                  {finanzas.repuestos_bajo_stock.slice(0, 5).map((r) => (
                    <li key={r.repuesto_id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <span className="truncate text-ink-2">{r.nombre}</span>
                      <span className="shrink-0 text-[0.87rem] font-semibold text-warn">
                        Quedan {r.stock_actual} de {r.stock_minimo}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
