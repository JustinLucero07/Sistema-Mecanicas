"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, ClipboardList, MessageCircle, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { estadoOrden, etiqueta, formatoFecha, formatoKm, formatoMoneda, nombreCliente, nombreVehiculo } from "@/lib/format";
import type { TimelineEvento, Vehiculo } from "@/lib/types";
import RecepcionForm from "@/components/RecepcionForm";
import { Alert, Badge, Button, Card, EmptyState, Modal, Plate, Select, Skeleton, Tabs } from "@/components/ui";

type Tab = "historial" | "fotos" | "datos";

const TIPOS_FOTO = ["frente", "parte_trasera", "lateral_izquierdo", "lateral_derecho", "interior", "motor", "placa", "danio"];

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.87rem] text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value || "—"}</dd>
    </div>
  );
}

export default function VehiculoDetalle({ vehiculoId }: { vehiculoId: number }) {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvento[] | null>(null);
  const [tab, setTab] = useState<Tab>("historial");
  const [recepcionOpen, setRecepcionOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoFoto, setTipoFoto] = useState("frente");
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(() => {
    api
      .get<Vehiculo>(`/api/vehiculos/${vehiculoId}`)
      .then(setVehiculo)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el vehículo."));
    api.get<TimelineEvento[]>(`/api/vehiculos/${vehiculoId}/timeline`).then(setTimeline).catch(() => setTimeline([]));
  }, [vehiculoId]);

  useEffect(cargar, [cargar]);

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      formData.append("tipo", tipoFoto);
      await api.postForm(`/api/vehiculos/${vehiculoId}/fotos`, formData);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir la foto. Revisa que el almacenamiento esté en línea.");
    } finally {
      setSubiendo(false);
    }
  }

  if (!vehiculo) {
    return error ? (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Link href="/vehiculos" className="font-semibold text-brand-text hover:underline">
          Volver a vehículos
        </Link>
      </div>
    ) : (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const cliente = vehiculo.cliente;
  const telefonoWa = (cliente?.whatsapp || cliente?.telefono || "").replace(/\D/g, "");
  const ultima = timeline?.[0];
  const proximoKm = vehiculo.proximo_mantenimiento_km;
  const faltanKm = proximoKm && vehiculo.kilometraje_actual ? proximoKm - vehiculo.kilometraje_actual : null;
  const fotos = vehiculo.fotos ?? [];

  return (
    <>
      <Link href="/vehiculos" className="inline-flex items-center gap-1.5 text-[0.93rem] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> Vehículos
      </Link>

      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex flex-wrap items-center gap-5">
            <Plate placa={vehiculo.placa} size="lg" />
            <div>
              <h1 className="font-display text-[2.1rem] leading-none font-semibold tracking-tight">{nombreVehiculo(vehiculo)}</h1>
              <p className="mt-2 text-ink-2">
                {nombreCliente(cliente)}
                {cliente?.telefono && <span className="text-ink-3"> · {cliente.telefono}</span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vehiculo.estado === "en_taller" && <Badge tone="brand">En el taller</Badge>}
                {faltanKm !== null && faltanKm <= 1000 && (
                  <Badge tone="warn">{faltanKm <= 0 ? "Mantenimiento vencido" : `Mantenimiento en ${formatoKm(faltanKm)}`}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {telefonoWa && (
              <a
                href={`https://wa.me/${telefonoWa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-[0.93rem] font-semibold hover:bg-raised"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
            <Button icon={Plus} onClick={() => setRecepcionOpen(true)}>
              Nueva orden
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 md:grid-cols-4">
          <Dato label="Kilometraje" value={formatoKm(vehiculo.kilometraje_actual)} />
          <Dato label="Última visita" value={ultima ? formatoFecha(ultima.fecha) : "Sin visitas"} />
          <Dato label="Último servicio" value={ultima?.motivo ?? "—"} />
          <Dato label="Próximo mantenimiento" value={proximoKm ? formatoKm(proximoKm) : "Sin programar"} />
        </dl>
      </Card>

      {error && <Alert>{error}</Alert>}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "historial", label: "Historial", count: timeline?.length },
          { value: "fotos", label: "Fotos", count: fotos.length },
          { value: "datos", label: "Datos del vehículo" },
        ]}
      />

      {tab === "historial" &&
        (timeline === null ? (
          <Skeleton className="h-48" />
        ) : timeline.length === 0 ? (
          <Card>
            <EmptyState icon={ClipboardList} title="Este vehículo aún no tiene historial" description="Cada orden de trabajo quedará registrada aquí con su kilometraje, repuestos y costo.">
              <Button icon={Plus} onClick={() => setRecepcionOpen(true)}>
                Nueva orden
              </Button>
            </EmptyState>
          </Card>
        ) : (
          <ol className="relative ml-2 space-y-4 border-l-2 border-line pl-6 md:ml-28">
            {timeline.map((ev) => {
              const estado = estadoOrden(ev.estado);
              return (
                <li key={ev.orden_id} className="relative">
                  <span className="absolute top-5 -left-[1.95rem] size-3 rounded-full border-2 border-surface bg-brand ring-2 ring-line" aria-hidden />
                  <time className="absolute top-4 right-full mr-10 hidden w-24 text-right text-[0.87rem] font-semibold text-ink-2 md:block">
                    {formatoFecha(ev.fecha)}
                  </time>
                  <Card className="p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.87rem] text-ink-3 md:hidden">{formatoFecha(ev.fecha)}</p>
                        <h3 className="text-[1.05rem] font-semibold text-ink">{ev.motivo || "Orden de trabajo"}</h3>
                        <p className="mt-0.5 text-[0.87rem] text-ink-3">
                          {formatoKm(ev.kilometraje)} · {ev.mecanico_nombre ?? "Sin mecánico asignado"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={estado.tono}>{estado.label}</Badge>
                        <span className="font-display text-xl font-semibold">{formatoMoneda(ev.costo_total)}</span>
                      </div>
                    </div>

                    {(ev.diagnostico || ev.trabajos_realizados) && (
                      <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                        {ev.diagnostico && (
                          <div>
                            <dt className="text-[0.87rem] text-ink-3">Diagnóstico</dt>
                            <dd className="text-ink-2">{ev.diagnostico}</dd>
                          </div>
                        )}
                        {ev.trabajos_realizados && (
                          <div>
                            <dt className="text-[0.87rem] text-ink-3">Trabajo realizado</dt>
                            <dd className="text-ink-2">{ev.trabajos_realizados}</dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {ev.repuestos_utilizados.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        <span className="text-[0.87rem] text-ink-3">Repuestos:</span>
                        {ev.repuestos_utilizados.map((r) => (
                          <Badge key={r}>{r}</Badge>
                        ))}
                      </div>
                    )}

                    <Link href={`/ordenes/${ev.orden_id}`} className="mt-4 inline-block text-[0.87rem] font-semibold text-brand-text hover:underline">
                      Abrir orden {ev.numero_orden}
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ol>
        ))}

      {tab === "fotos" && (
        <Card className="p-5">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1.5 block text-[0.87rem] font-semibold text-ink-2">Qué muestra la foto</span>
              <Select value={tipoFoto} onChange={(e) => setTipoFoto(e.target.value)} className="w-52">
                {TIPOS_FOTO.map((t) => (
                  <option key={t} value={t}>
                    {t === "danio" ? "Daño existente" : etiqueta(t)}
                  </option>
                ))}
              </Select>
            </label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={subirFoto} />
            <Button variant="secondary" icon={Camera} disabled={subiendo} onClick={() => fileRef.current?.click()}>
              {subiendo ? "Subiendo…" : "Agregar foto"}
            </Button>
          </div>

          {fotos.length === 0 ? (
            <EmptyState icon={Camera} title="Sin fotos todavía" description="Fotografía el vehículo al recibirlo: es la evidencia de cómo llegó." />
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {fotos.map((f) => (
                <li key={f.id}>
                  <a href={f.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={etiqueta(f.tipo)} loading="lazy" className="aspect-[4/3] w-full bg-raised object-cover" />
                  </a>
                  <p className="mt-1.5 text-[0.87rem] font-semibold">{f.tipo === "danio" ? "Daño existente" : etiqueta(f.tipo)}</p>
                  <p className="text-[0.8rem] text-ink-3">{formatoFecha(f.creado_en)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "datos" && (
        <Card className="p-5 md:p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            <Dato label="Marca" value={vehiculo.marca} />
            <Dato label="Modelo" value={vehiculo.modelo} />
            <Dato label="Año" value={vehiculo.anio} />
            <Dato label="Color" value={vehiculo.color} />
            <Dato label="Tipo" value={vehiculo.tipo && etiqueta(vehiculo.tipo)} />
            <Dato label="Combustible" value={vehiculo.combustible && etiqueta(vehiculo.combustible)} />
            <Dato label="Transmisión" value={vehiculo.transmision && etiqueta(vehiculo.transmision)} />
            <Dato label="Cilindraje" value={vehiculo.cilindraje} />
            <Dato label="VIN / chasis" value={vehiculo.vin_chasis} />
            <Dato label="Propietario" value={nombreCliente(cliente)} />
            <Dato label="Cédula o RUC" value={cliente?.cedula_ruc} />
            <Dato label="Correo" value={cliente?.email} />
          </dl>
          {vehiculo.notas && <p className="mt-5 border-t border-line pt-4 text-ink-2">{vehiculo.notas}</p>}
        </Card>
      )}

      <Modal open={recepcionOpen} onClose={() => setRecepcionOpen(false)} title="Recibir vehículo" description={`${vehiculo.placa} · ${nombreVehiculo(vehiculo)}`} width="max-w-2xl">
        <RecepcionForm vehiculo={vehiculo} onCancel={() => setRecepcionOpen(false)} />
      </Modal>
    </>
  );
}
