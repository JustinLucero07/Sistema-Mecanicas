"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FLUJO_ORDEN, estadoOrden, etiqueta, formatoFechaHora, formatoKm, formatoMoneda, nombreCliente, nombreVehiculo } from "@/lib/format";
import type { EstadoOrden, OrdenTrabajo, Repuesto } from "@/lib/types";
import { puedeVerFinanzas } from "@/components/ProtectedShell";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Plate, Select, Skeleton, Td, Textarea, Th, cn } from "@/components/ui";

type Mecanico = { id: number; nombre: string; rol: string; activo: boolean };

const COMBUSTIBLE: Record<number, string> = { 0: "Reserva", 25: "1/4", 50: "1/2", 75: "3/4", 100: "Lleno" };
const TIPO_LINEA: Record<string, string> = { mano_obra: "Mano de obra", repuesto: "Repuesto", servicio_externo: "Servicio externo" };

// Los estados antiguos se ubican en el paso equivalente del flujo actual.
const EQUIVALE: Record<string, EstadoOrden> = { pendiente: "recepcion", en_proceso: "en_reparacion", completado: "listo_para_entregar" };

export default function OrdenDetalle({ ordenId }: { ordenId: number }) {
  const { sesion } = useAuth();
  const puedeCobrar = puedeVerFinanzas(sesion?.rol);
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [diagnostico, setDiagnostico] = useState("");
  const [trabajos, setTrabajos] = useState("");
  const [linea, setLinea] = useState({ tipo: "mano_obra", repuesto_id: "", descripcion: "", cantidad: "1", precio_unitario: "" });
  const [pago, setPago] = useState({ monto: "", metodo_pago: "efectivo" });

  const aplicar = useCallback((o: OrdenTrabajo) => {
    setOrden(o);
    setDiagnostico(o.diagnostico ?? "");
    setTrabajos(o.trabajos_realizados ?? "");
    setPago((p) => ({ ...p, monto: (o.saldo_pendiente ?? 0) > 0 ? String(o.saldo_pendiente) : "" }));
  }, []);

  useEffect(() => {
    api
      .get<OrdenTrabajo>(`/api/ordenes/${ordenId}`)
      .then(aplicar)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar la orden."));
    api.get<Repuesto[]>("/api/inventario/repuestos").then(setRepuestos).catch(() => {});
    // Solo administración puede listar usuarios; sin permiso, el selector no se muestra.
    api
      .get<Mecanico[]>("/api/usuarios")
      .then((u) => setMecanicos(u.filter((x) => x.activo && x.rol === "mecanico")))
      .catch(() => {});
  }, [ordenId, aplicar]);

  async function ejecutar(accion: () => Promise<OrdenTrabajo>, mensaje: string) {
    setError(null);
    setAviso(null);
    setOcupado(true);
    try {
      aplicar(await accion());
      setAviso(mensaje);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  if (!orden) {
    return error ? (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Link href="/ordenes" className="font-semibold text-brand-text hover:underline">
          Volver a órdenes
        </Link>
      </div>
    ) : (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const estadoActual = EQUIVALE[orden.estado] ?? orden.estado;
  const paso = FLUJO_ORDEN.indexOf(estadoActual);
  const cancelada = orden.estado === "cancelado";
  const cerrada = cancelada || orden.estado === "entregado";
  const siguiente = paso >= 0 && paso < FLUJO_ORDEN.length - 1 ? FLUJO_ORDEN[paso + 1] : null;
  const saldo = orden.saldo_pendiente ?? 0;
  const checklist = orden.checklist_recepcion;
  const numero = orden.numero_orden ?? `OT-${orden.id}`;

  const cambiarEstado = (estado: EstadoOrden) =>
    ejecutar(() => api.patch<OrdenTrabajo>(`/api/ordenes/${orden.id}`, { estado }), `La orden pasó a “${estadoOrden(estado).label}”.`);

  function elegirRepuesto(id: string) {
    const r = repuestos.find((x) => String(x.id) === id);
    setLinea((l) => ({ ...l, repuesto_id: id, descripcion: r?.nombre ?? l.descripcion, precio_unitario: r ? String(r.precio_venta) : l.precio_unitario }));
  }

  function agregarLinea(e: React.FormEvent) {
    e.preventDefault();
    ejecutar(
      () =>
        api.post<OrdenTrabajo>(`/api/ordenes/${orden!.id}/detalles`, {
          tipo: linea.tipo,
          descripcion: linea.descripcion.trim(),
          cantidad: Number(linea.cantidad || "1"),
          precio_unitario: Number(linea.precio_unitario),
          repuesto_id: linea.tipo === "repuesto" && linea.repuesto_id ? Number(linea.repuesto_id) : null,
        }),
      "Línea agregada.",
    ).then(() => setLinea({ tipo: "mano_obra", repuesto_id: "", descripcion: "", cantidad: "1", precio_unitario: "" }));
  }

  const quitarLinea = (detalleId: number) =>
    ejecutar(
      () => api.delete<OrdenTrabajo>(`/api/ordenes/${orden.id}/detalles/${detalleId}`),
      "Línea quitada. Si era un repuesto, volvió al inventario.",
    );

  function registrarPago(e: React.FormEvent) {
    e.preventDefault();
    ejecutar(
      () => api.post<OrdenTrabajo>(`/api/ordenes/${orden!.id}/pagar`, { monto: Number(pago.monto), metodo_pago: pago.metodo_pago }),
      `Pago de ${formatoMoneda(Number(pago.monto))} registrado.`,
    );
  }

  return (
    <>
      <Link href="/ordenes" className="inline-flex items-center gap-1.5 text-[0.93rem] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> Órdenes
      </Link>

      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex flex-wrap items-center gap-5">
            <Plate placa={orden.vehiculo?.placa ?? "—"} size="lg" />
            <div>
              <p className="text-[0.93rem] text-ink-3">
                Orden {numero} · ingresó {formatoFechaHora(orden.fecha_ingreso)}
              </p>
              <h1 className="mt-1 font-display text-[2.1rem] leading-none font-semibold tracking-tight">{nombreVehiculo(orden.vehiculo)}</h1>
              <p className="mt-2 text-ink-2">
                {nombreCliente(orden.cliente ?? orden.vehiculo?.cliente)} ·{" "}
                <Link href={`/vehiculos/${orden.vehiculo_id}`} className="font-semibold text-brand-text hover:underline">
                  Ver historial del vehículo
                </Link>
              </p>
            </div>
          </div>
          {!cerrada && siguiente && (
            <Button size="lg" disabled={ocupado} onClick={() => cambiarEstado(siguiente)}>
              Pasar a {estadoOrden(siguiente).label.toLowerCase()}
            </Button>
          )}
          {cancelada && <Badge tone="bad">Orden cancelada</Badge>}
        </div>

        {!cancelada && (
          <ol className="mt-6 grid grid-cols-2 gap-x-2 gap-y-3 border-t border-line pt-5 sm:grid-cols-4 xl:grid-cols-8">
            {FLUJO_ORDEN.map((estado, i) => {
              const hecho = i < paso;
              const actual = i === paso;
              return (
                <li key={estado}>
                  <button
                    disabled={ocupado || actual}
                    onClick={() => cambiarEstado(estado)}
                    aria-current={actual ? "step" : undefined}
                    title={actual ? "Estado actual" : `Cambiar a ${estadoOrden(estado).label}`}
                    className="group w-full text-left disabled:cursor-default"
                  >
                    <span className={cn("block h-1.5 rounded-full transition-colors", hecho || actual ? "bg-brand" : "bg-line group-hover:bg-line-strong")} />
                    <span className={cn("mt-2 flex items-center gap-1 text-[0.87rem] leading-tight", actual ? "font-semibold text-ink" : hecho ? "text-ink-2" : "text-ink-3")}>
                      {hecho && <Check className="size-3.5 shrink-0 text-brand-text" aria-hidden />}
                      {estadoOrden(estado).label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {error && <Alert>{error}</Alert>}
      {aviso && <Alert tone="ok">{aviso}</Alert>}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Recepción" />
            <div className="space-y-4 p-5">
              <div>
                <p className="text-[0.87rem] text-ink-3">Motivo de ingreso</p>
                <p className="mt-0.5 text-ink">{orden.motivo_ingreso || "No se registró."}</p>
              </div>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[0.87rem] text-ink-3">Kilometraje</dt>
                  <dd className="font-semibold">{formatoKm(orden.kilometraje_ingreso)}</dd>
                </div>
                {checklist && (
                  <>
                    <div>
                      <dt className="text-[0.87rem] text-ink-3">Combustible</dt>
                      <dd className="font-semibold">{COMBUSTIBLE[checklist.nivel_combustible] ?? `${checklist.nivel_combustible}%`}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-[0.87rem] text-ink-3">Ingresó con</dt>
                      <dd className="font-semibold">
                        {[
                          checklist.radio && "radio",
                          checklist.herramientas && "herramientas",
                          checklist.gato_palanca && "gato",
                          checklist.llanta_emergencia && "llanta de emergencia",
                        ]
                          .filter(Boolean)
                          .join(", ") || "Sin accesorios"}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              {checklist?.observaciones_recepcion && (
                <div>
                  <p className="text-[0.87rem] text-ink-3">Daños visibles al ingresar</p>
                  <p className="mt-0.5 text-ink">{checklist.observaciones_recepcion}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Diagnóstico y trabajo" description="Lo que quede aquí pasa al historial del vehículo." />
            <form
              className="space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                ejecutar(() => api.patch<OrdenTrabajo>(`/api/ordenes/${orden.id}`, { diagnostico, trabajos_realizados: trabajos }), "Diagnóstico y trabajo guardados.");
              }}
            >
              <Field label="Diagnóstico">
                <Textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} disabled={cerrada} placeholder="Qué se encontró al revisar el vehículo" />
              </Field>
              <Field label="Trabajo realizado">
                <Textarea value={trabajos} onChange={(e) => setTrabajos(e.target.value)} disabled={cerrada} placeholder="Qué se hizo y qué se recomienda para la próxima visita" />
              </Field>
              {!cerrada && (
                <div className="flex justify-end">
                  <Button type="submit" variant="secondary" disabled={ocupado}>
                    Guardar
                  </Button>
                </div>
              )}
            </form>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Mano de obra y repuestos" description="Los repuestos elegidos del inventario se descuentan del stock." />
            {orden.detalles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem]">
                  <thead className="border-b border-line">
                    <tr>
                      <Th>Descripción</Th>
                      <Th className="text-right">Cant.</Th>
                      <Th className="text-right">Precio</Th>
                      <Th className="text-right">Subtotal</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orden.detalles.map((d) => (
                      <tr key={d.id}>
                        <Td>
                          <p className="font-semibold">{d.descripcion}</p>
                          <p className="text-[0.87rem] text-ink-3">{TIPO_LINEA[d.tipo] ?? etiqueta(d.tipo)}</p>
                        </Td>
                        <Td className="text-right text-ink-2">{d.cantidad}</Td>
                        <Td className="text-right text-ink-2">{formatoMoneda(d.precio_unitario)}</Td>
                        <Td className="text-right font-semibold">{formatoMoneda(d.subtotal)}</Td>
                        <Td className="w-10 text-right">
                          {!cerrada && (
                            <button onClick={() => quitarLinea(d.id)} disabled={ocupado} aria-label={`Quitar ${d.descripcion}`} className="rounded-lg p-1.5 text-ink-3 hover:bg-bad-soft hover:text-bad">
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!cerrada && (
              <form onSubmit={agregarLinea} className="grid gap-2 border-t border-line bg-raised p-4 sm:grid-cols-[9.5rem_1fr_4.5rem_6.5rem_auto]">
                <Select value={linea.tipo} onChange={(e) => setLinea((l) => ({ ...l, tipo: e.target.value, repuesto_id: "" }))} aria-label="Tipo de línea">
                  <option value="mano_obra">Mano de obra</option>
                  <option value="repuesto">Repuesto</option>
                  <option value="servicio_externo">Servicio externo</option>
                </Select>
                {linea.tipo === "repuesto" && repuestos.length > 0 ? (
                  <Select required value={linea.repuesto_id} onChange={(e) => elegirRepuesto(e.target.value)} aria-label="Repuesto del inventario">
                    <option value="">Elige un repuesto del inventario</option>
                    {repuestos.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.stock_actual <= 0}>
                        {r.nombre} · quedan {r.stock_actual}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input required value={linea.descripcion} onChange={(e) => setLinea((l) => ({ ...l, descripcion: e.target.value }))} placeholder="Descripción del trabajo" aria-label="Descripción" />
                )}
                <Input type="number" min={0} step="any" required value={linea.cantidad} onChange={(e) => setLinea((l) => ({ ...l, cantidad: e.target.value }))} aria-label="Cantidad" />
                <Input type="number" min={0} step="0.01" required value={linea.precio_unitario} onChange={(e) => setLinea((l) => ({ ...l, precio_unitario: e.target.value }))} placeholder="Precio" aria-label="Precio unitario" />
                <Button type="submit" icon={Plus} disabled={ocupado}>
                  Agregar
                </Button>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader title="Cobro" />
            <dl className="space-y-2 p-5 text-[0.93rem]">
              <div className="flex justify-between text-ink-2">
                <dt>Subtotal</dt>
                <dd>{formatoMoneda(orden.subtotal)}</dd>
              </div>
              {(orden.descuento ?? 0) > 0 && (
                <div className="flex justify-between text-ink-2">
                  <dt>Descuento</dt>
                  <dd>−{formatoMoneda(orden.descuento)}</dd>
                </div>
              )}
              {(orden.impuestos ?? 0) > 0 && (
                <div className="flex justify-between text-ink-2">
                  <dt>Impuestos</dt>
                  <dd>{formatoMoneda(orden.impuestos)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-3xl font-semibold">{formatoMoneda(orden.total)}</dd>
              </div>
              <div className="flex justify-between text-ink-2">
                <dt>Pagado</dt>
                <dd>{formatoMoneda(orden.monto_pagado)}</dd>
              </div>
              <div className={cn("flex justify-between font-semibold", saldo > 0 ? "text-warn" : "text-ok")}>
                <dt>Saldo</dt>
                <dd>{saldo > 0 ? formatoMoneda(saldo) : orden.total > 0 ? "Pagado por completo" : formatoMoneda(0)}</dd>
              </div>
            </dl>

            {puedeCobrar && saldo > 0 && !cancelada && (
              <form onSubmit={registrarPago} className="space-y-3 border-t border-line p-5">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Monto">
                    <Input type="number" min={0.01} max={saldo} step="0.01" required value={pago.monto} onChange={(e) => setPago((p) => ({ ...p, monto: e.target.value }))} />
                  </Field>
                  <Field label="Forma de pago">
                    <Select value={pago.metodo_pago} onChange={(e) => setPago((p) => ({ ...p, metodo_pago: e.target.value }))}>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="otro">Otro</option>
                    </Select>
                  </Field>
                </div>
                <Button type="submit" className="w-full" disabled={ocupado}>
                  Registrar pago
                </Button>
              </form>
            )}
          </Card>

          <Card>
            <CardHeader title="Mecánico" />
            <div className="p-5">
              {mecanicos.length > 0 && !cerrada ? (
                <Select
                  value={orden.mecanico_id ?? ""}
                  aria-label="Mecánico asignado"
                  disabled={ocupado}
                  onChange={(e) =>
                    e.target.value &&
                    ejecutar(() => api.patch<OrdenTrabajo>(`/api/ordenes/${orden.id}`, { mecanico_id: Number(e.target.value) }), "Mecánico asignado.")
                  }
                >
                  <option value="">Sin asignar</option>
                  {mecanicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="font-semibold">{orden.mecanico?.nombre ?? "Sin asignar"}</p>
              )}
            </div>
          </Card>

          {!cerrada && (
            <Button
              variant="ghost"
              className="w-full text-bad hover:bg-bad-soft hover:text-bad"
              disabled={ocupado}
              onClick={() => window.confirm(`¿Cancelar la orden ${numero}? El vehículo saldrá del tablero del taller.`) && cambiarEstado("cancelado")}
            >
              Cancelar orden
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
