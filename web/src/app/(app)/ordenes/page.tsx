"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { estadoOrden, formatoFecha, formatoMoneda, nombreCliente, nombreVehiculo } from "@/lib/format";
import type { OrdenTrabajo } from "@/lib/types";
import { Alert, Badge, ButtonLink, Card, EmptyState, PageHeader, Plate, Skeleton, Tabs, Td, Th } from "@/components/ui";

type Filtro = "activas" | "por_cobrar" | "entregadas" | "todas";

const CERRADAS = ["entregado", "cancelado"];

export default function OrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("activas");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<OrdenTrabajo[]>("/api/ordenes")
      .then(setOrdenes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar las órdenes."));
  }, []);

  const lista = ordenes ?? [];
  const grupos: Record<Filtro, OrdenTrabajo[]> = {
    activas: lista.filter((o) => !CERRADAS.includes(o.estado)),
    por_cobrar: lista.filter((o) => o.estado !== "cancelado" && (o.saldo_pendiente ?? 0) > 0),
    entregadas: lista.filter((o) => o.estado === "entregado"),
    todas: lista,
  };
  const visibles = grupos[filtro];

  return (
    <>
      <PageHeader
        title="Órdenes de trabajo"
        description="Cada vehículo que entra al taller tiene una orden. Ábrela para avanzar su estado, anotar el trabajo y cobrar."
        actions={<ButtonLink href="/vehiculos">Recibir vehículo</ButtonLink>}
      />

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="px-3 pt-1">
          <Tabs
            value={filtro}
            onChange={setFiltro}
            items={[
              { value: "activas", label: "En el taller", count: grupos.activas.length },
              { value: "por_cobrar", label: "Con saldo por cobrar", count: grupos.por_cobrar.length },
              { value: "entregadas", label: "Entregadas", count: grupos.entregadas.length },
              { value: "todas", label: "Todas", count: lista.length },
            ]}
          />
        </div>

        {ordenes === null && !error ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : visibles.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No hay órdenes en esta lista" description="Para abrir una orden, busca el vehículo y elige “Nueva orden”." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem]">
              <thead className="border-b border-line">
                <tr>
                  <Th>Orden</Th>
                  <Th>Vehículo</Th>
                  <Th>Motivo</Th>
                  <Th>Estado</Th>
                  <Th>Mecánico</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Saldo</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((o) => {
                  const estado = estadoOrden(o.estado);
                  const saldo = o.saldo_pendiente ?? 0;
                  return (
                    <tr key={o.id} onClick={() => router.push(`/ordenes/${o.id}`)} className="cursor-pointer transition-colors hover:bg-raised">
                      <Td>
                        <Link href={`/ordenes/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold hover:underline">
                          {o.numero_orden ?? `OT-${o.id}`}
                        </Link>
                        <p className="text-[0.87rem] text-ink-3">{formatoFecha(o.fecha_ingreso)}</p>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Plate placa={o.vehiculo?.placa ?? "—"} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{nombreVehiculo(o.vehiculo)}</p>
                            <p className="truncate text-[0.87rem] text-ink-3">{nombreCliente(o.cliente ?? o.vehiculo?.cliente)}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="max-w-[16rem] truncate text-ink-2">{o.motivo_ingreso || "—"}</Td>
                      <Td>
                        <Badge tone={estado.tono}>{estado.label}</Badge>
                      </Td>
                      <Td className="text-ink-2">{o.mecanico?.nombre ?? "Sin asignar"}</Td>
                      <Td className="text-right font-semibold">{formatoMoneda(o.total)}</Td>
                      <Td className={saldo > 0 ? "text-right font-semibold text-warn" : "text-right text-ink-3"}>{saldo > 0 ? formatoMoneda(saldo) : o.total > 0 ? "Pagado" : "—"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
