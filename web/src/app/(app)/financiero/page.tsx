"use client";

import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, Receipt } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { etiqueta, formatoFecha, formatoMoneda, nombreCategoria } from "@/lib/format";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Tabs, Td, Th, cn } from "@/components/ui";

interface Ingreso {
  id: number;
  concepto: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
}

interface Egreso {
  id: number;
  categoria: string;
  descripcion: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
}

interface Caja {
  id: number;
  monto_apertura: number;
  monto_cierre_esperado: number | null;
  monto_cierre_real: number | null;
  diferencia: number | null;
  cerrada: boolean;
}

const CATEGORIAS_EGRESO = ["repuestos", "nomina", "alquiler", "servicios_basicos", "herramientas", "impuestos", "marketing", "mantenimiento_local", "otros"];

const METODOS = (
  <>
    <option value="efectivo">Efectivo</option>
    <option value="transferencia">Transferencia</option>
    <option value="tarjeta">Tarjeta</option>
    <option value="otro">Otro</option>
  </>
);

type Tab = "ingresos" | "egresos";

function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function rangoMes(mes: string): { desde: string; hasta: string } {
  const [anio, m] = mes.split("-").map(Number);
  const fin = new Date(anio, m, 1);
  return { desde: `${mes}-01`, hasta: `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, "0")}-01` };
}

export default function FinancieroPage() {
  const [mes, setMes] = useState(mesActual);
  const [tab, setTab] = useState<Tab>("ingresos");
  const [ingresos, setIngresos] = useState<Ingreso[] | null>(null);
  const [egresos, setEgresos] = useState<Egreso[] | null>(null);
  const [caja, setCaja] = useState<Caja | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<Tab | null>(null);
  const [formIngreso, setFormIngreso] = useState({ concepto: "", monto: "", metodo_pago: "efectivo" });
  const [formEgreso, setFormEgreso] = useState({ categoria: "repuestos", descripcion: "", monto: "", metodo_pago: "efectivo" });
  const [montoCaja, setMontoCaja] = useState("");
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    const { desde, hasta } = rangoMes(mes);
    const rango = `?desde=${desde}&hasta=${hasta}`;
    const alFallar = (err: unknown) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar los movimientos.");
    api.get<Ingreso[]>(`/api/financiero/ingresos${rango}`).then(setIngresos).catch(alFallar);
    api.get<Egreso[]>(`/api/financiero/egresos${rango}`).then(setEgresos).catch(alFallar);
    api.get<Caja | null>("/api/financiero/caja/hoy").then(setCaja).catch(() => setCaja(null));
  }, [mes]);

  useEffect(cargar, [cargar]);

  async function guardar(accion: () => Promise<unknown>, alTerminar: () => void, enModal = true) {
    setErrorForm(null);
    setError(null);
    setGuardando(true);
    try {
      await accion();
      alTerminar();
      cargar();
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se pudo guardar. Inténtalo de nuevo.";
      if (enModal) setErrorForm(mensaje);
      else setError(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  const totalIngresos = (ingresos ?? []).reduce((s, i) => s + i.monto, 0);
  const totalEgresos = (egresos ?? []).reduce((s, e) => s + e.monto, 0);
  const utilidad = totalIngresos - totalEgresos;
  const cargando = ingresos === null || egresos === null;

  return (
    <>
      <PageHeader
        title="Caja y finanzas"
        description="Los cobros de órdenes entran solos. Registra aquí los demás ingresos y todos los gastos."
        actions={
          <>
            <Button variant="secondary" icon={Minus} onClick={() => setModal("egresos")}>
              Registrar egreso
            </Button>
            <Button icon={Plus} onClick={() => setModal("ingresos")}>
              Registrar ingreso
            </Button>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <h2 className="font-display text-xl font-semibold">Resumen del mes</h2>
              <Input type="month" value={mes} max={mesActual()} onChange={(e) => e.target.value && setMes(e.target.value)} aria-label="Mes" className="w-44" />
            </div>
            <dl className="grid divide-line max-sm:divide-y sm:grid-cols-3 sm:divide-x">
              {[
                { label: "Ingresos", valor: totalIngresos, clase: "text-ink" },
                { label: "Egresos", valor: totalEgresos, clase: "text-ink" },
                { label: "Utilidad", valor: utilidad, clase: utilidad >= 0 ? "text-ok" : "text-bad" },
              ].map((c) => (
                <div key={c.label} className="px-5 py-4">
                  <dt className="text-[0.87rem] text-ink-3">{c.label}</dt>
                  <dd className={cn("mt-1 font-display text-[2.1rem] leading-none font-semibold", c.clase)}>{cargando ? "…" : formatoMoneda(c.valor)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-3 pt-1">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { value: "ingresos", label: "Ingresos", count: ingresos?.length },
                  { value: "egresos", label: "Egresos", count: egresos?.length },
                ]}
              />
            </div>

            {cargando ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (tab === "ingresos" ? ingresos : egresos).length === 0 ? (
              <EmptyState icon={Receipt} title={tab === "ingresos" ? "Sin ingresos este mes" : "Sin egresos este mes"} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem]">
                  <thead className="border-b border-line">
                    <tr>
                      <Th>Fecha</Th>
                      <Th>{tab === "ingresos" ? "Concepto" : "Descripción"}</Th>
                      <Th>Forma de pago</Th>
                      <Th className="text-right">Monto</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tab === "ingresos"
                      ? ingresos.map((i) => (
                          <tr key={i.id}>
                            <Td className="whitespace-nowrap text-ink-2">{formatoFecha(i.fecha)}</Td>
                            <Td className="font-semibold">{i.concepto}</Td>
                            <Td className="text-ink-2">{etiqueta(i.metodo_pago)}</Td>
                            <Td className="text-right font-semibold">{formatoMoneda(i.monto)}</Td>
                          </tr>
                        ))
                      : egresos.map((e) => (
                          <tr key={e.id}>
                            <Td className="whitespace-nowrap text-ink-2">{formatoFecha(e.fecha)}</Td>
                            <Td>
                              <p className="font-semibold">{e.descripcion}</p>
                              <p className="text-[0.87rem] text-ink-3">{nombreCategoria(e.categoria)}</p>
                            </Td>
                            <Td className="text-ink-2">{etiqueta(e.metodo_pago)}</Td>
                            <Td className="text-right font-semibold">{formatoMoneda(e.monto)}</Td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Caja de hoy"
            action={caja === undefined ? null : caja === null ? <Badge>Sin abrir</Badge> : caja.cerrada ? <Badge>Cerrada</Badge> : <Badge tone="ok">Abierta</Badge>}
          />
          <div className="p-5">
            {caja === undefined && <Skeleton className="h-24" />}

            {caja === null && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar(() => api.post("/api/financiero/caja/abrir", { monto_apertura: Number(montoCaja) }), () => setMontoCaja(""), false);
                }}
              >
                <p className="text-ink-2">Cuenta el efectivo con el que empieza el día.</p>
                <Field label="Efectivo inicial">
                  <Input type="number" min={0} step="0.01" required value={montoCaja} onChange={(e) => setMontoCaja(e.target.value)} />
                </Field>
                <Button type="submit" className="w-full" disabled={guardando}>
                  Abrir caja
                </Button>
              </form>
            )}

            {caja && !caja.cerrada && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar(() => api.post("/api/financiero/caja/cerrar", { monto_cierre_real: Number(montoCaja) }), () => setMontoCaja(""), false);
                }}
              >
                <div className="flex justify-between text-ink-2">
                  <span>Efectivo inicial</span>
                  <span className="font-semibold text-ink">{formatoMoneda(caja.monto_apertura)}</span>
                </div>
                <Field label="Efectivo contado al cerrar" hint="Se compara con lo que debería haber según los movimientos de hoy.">
                  <Input type="number" min={0} step="0.01" required value={montoCaja} onChange={(e) => setMontoCaja(e.target.value)} />
                </Field>
                <Button type="submit" variant="secondary" className="w-full" disabled={guardando}>
                  Cerrar caja
                </Button>
              </form>
            )}

            {caja?.cerrada && (
              <dl className="space-y-2">
                {[
                  { label: "Efectivo inicial", valor: caja.monto_apertura },
                  { label: "Debía haber", valor: caja.monto_cierre_esperado },
                  { label: "Se contó", valor: caja.monto_cierre_real },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between text-ink-2">
                    <dt>{f.label}</dt>
                    <dd className="font-semibold text-ink">{formatoMoneda(f.valor)}</dd>
                  </div>
                ))}
                <div className={cn("flex justify-between border-t border-line pt-3 font-semibold", (caja.diferencia ?? 0) === 0 ? "text-ok" : "text-bad")}>
                  <dt>{(caja.diferencia ?? 0) === 0 ? "Caja cuadrada" : (caja.diferencia ?? 0) > 0 ? "Sobrante" : "Faltante"}</dt>
                  <dd>{formatoMoneda(Math.abs(caja.diferencia ?? 0))}</dd>
                </div>
              </dl>
            )}
          </div>
        </Card>
      </div>

      <Modal open={modal === "ingresos"} onClose={() => setModal(null)} title="Registrar ingreso" description="Para dinero que no viene del cobro de una orden." width="max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            guardar(
              () => api.post("/api/financiero/ingresos", { concepto: formIngreso.concepto.trim(), monto: Number(formIngreso.monto), metodo_pago: formIngreso.metodo_pago }),
              () => {
                setFormIngreso({ concepto: "", monto: "", metodo_pago: "efectivo" });
                setModal(null);
                setTab("ingresos");
              },
            );
          }}
        >
          <Field label="Concepto">
            <Input required autoFocus value={formIngreso.concepto} onChange={(e) => setFormIngreso((f) => ({ ...f, concepto: e.target.value }))} placeholder="Venta de chatarra" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto">
              <Input type="number" min={0.01} step="0.01" required value={formIngreso.monto} onChange={(e) => setFormIngreso((f) => ({ ...f, monto: e.target.value }))} />
            </Field>
            <Field label="Forma de pago">
              <Select value={formIngreso.metodo_pago} onChange={(e) => setFormIngreso((f) => ({ ...f, metodo_pago: e.target.value }))}>
                {METODOS}
              </Select>
            </Field>
          </div>
          {errorForm && <Alert>{errorForm}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              Registrar ingreso
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "egresos"} onClose={() => setModal(null)} title="Registrar egreso" width="max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            guardar(
              () => api.post("/api/financiero/egresos", { ...formEgreso, descripcion: formEgreso.descripcion.trim(), monto: Number(formEgreso.monto) }),
              () => {
                setFormEgreso({ categoria: "repuestos", descripcion: "", monto: "", metodo_pago: "efectivo" });
                setModal(null);
                setTab("egresos");
              },
            );
          }}
        >
          <Field label="Categoría">
            <Select value={formEgreso.categoria} onChange={(e) => setFormEgreso((f) => ({ ...f, categoria: e.target.value }))}>
              {CATEGORIAS_EGRESO.map((c) => (
                <option key={c} value={c}>
                  {nombreCategoria(c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descripción">
            <Input required autoFocus value={formEgreso.descripcion} onChange={(e) => setFormEgreso((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Compra de filtros a proveedor" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto">
              <Input type="number" min={0.01} step="0.01" required value={formEgreso.monto} onChange={(e) => setFormEgreso((f) => ({ ...f, monto: e.target.value }))} />
            </Field>
            <Field label="Forma de pago">
              <Select value={formEgreso.metodo_pago} onChange={(e) => setFormEgreso((f) => ({ ...f, metodo_pago: e.target.value }))}>
                {METODOS}
              </Select>
            </Field>
          </div>
          {errorForm && <Alert>{errorForm}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              Registrar egreso
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
