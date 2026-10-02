"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CarFront, Plus, ScanLine, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatoKm, nombreCliente, nombreVehiculo } from "@/lib/format";
import type { Vehiculo } from "@/lib/types";
import ScannerModal from "@/components/ScannerModal";
import { Alert, Badge, Button, ButtonLink, Card, EmptyState, Input, PageHeader, Plate, Skeleton, Tabs, Td, Th } from "@/components/ui";

type Filtro = "todos" | "en_taller" | "mantenimiento";

function mantenimientoProximo(v: Vehiculo): boolean {
  return !!v.proximo_mantenimiento_km && !!v.kilometraje_actual && v.kilometraje_actual >= v.proximo_mantenimiento_km - 1000;
}

function ListaVehiculos({ consulta }: { consulta: string }) {
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehiculo[] | null>(null);
  const [q, setQ] = useState(consulta);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    api
      .get<Vehiculo[]>(`/api/vehiculos${consulta ? `?q=${encodeURIComponent(consulta)}` : ""}`)
      .then(setVehiculos)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar los vehículos."));
  }, [consulta]);

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/vehiculos?q=${encodeURIComponent(q.trim())}` : "/vehiculos");
  }

  const lista = vehiculos ?? [];
  const enTaller = lista.filter((v) => v.estado === "en_taller");
  const porMantenimiento = lista.filter(mantenimientoProximo);
  const visibles = filtro === "en_taller" ? enTaller : filtro === "mantenimiento" ? porMantenimiento : lista;

  return (
    <>
      <PageHeader
        title="Vehículos"
        description="Busca un vehículo para ver su historial o abrirle una orden de trabajo."
        actions={
          <>
            <Button variant="secondary" icon={ScanLine} onClick={() => setScannerOpen(true)}>
              Escanear placa
            </Button>
            <ButtonLink href="/vehiculos/nuevo" icon={Plus}>
              Registrar vehículo
            </ButtonLink>
          </>
        }
      />

      <form onSubmit={onBuscar} role="search" className="flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Placa, marca, modelo o cliente" aria-label="Buscar vehículo" className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="px-3 pt-1">
          <Tabs
            value={filtro}
            onChange={setFiltro}
            items={[
              { value: "todos", label: "Todos", count: lista.length },
              { value: "en_taller", label: "En el taller", count: enTaller.length },
              { value: "mantenimiento", label: "Mantenimiento próximo", count: porMantenimiento.length },
            ]}
          />
        </div>

        {vehiculos === null && !error ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : visibles.length === 0 ? (
          <EmptyState
            icon={CarFront}
            title={consulta ? `Nada coincide con “${consulta}”` : "No hay vehículos en esta lista"}
            description={consulta ? "Revisa la placa o registra el vehículo si es su primera visita." : "Registra el primer vehículo para empezar su historial."}
          >
            <ButtonLink href={`/vehiculos/nuevo${consulta ? `?placa=${encodeURIComponent(consulta.toUpperCase())}` : ""}`} icon={Plus}>
              Registrar vehículo
            </ButtonLink>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem]">
              <thead className="border-b border-line">
                <tr>
                  <Th>Placa</Th>
                  <Th>Vehículo</Th>
                  <Th>Propietario</Th>
                  <Th className="text-right">Kilometraje</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((v) => (
                  <tr key={v.id} onClick={() => router.push(`/vehiculos/${v.id}`)} className="cursor-pointer transition-colors hover:bg-raised">
                    <Td>
                      <Plate placa={v.placa} size="sm" />
                    </Td>
                    <Td>
                      <Link href={`/vehiculos/${v.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink hover:underline">
                        {nombreVehiculo(v)}
                      </Link>
                      {v.color && <p className="text-[0.87rem] text-ink-3">{v.color}</p>}
                    </Td>
                    <Td className="text-ink-2">{nombreCliente(v.cliente)}</Td>
                    <Td className="text-right text-ink-2">{formatoKm(v.kilometraje_actual)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {v.estado === "en_taller" && <Badge tone="brand">En el taller</Badge>}
                        {mantenimientoProximo(v) && <Badge tone="warn">Mantenimiento próximo</Badge>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </>
  );
}

function VehiculosConBusqueda() {
  const consulta = useSearchParams().get("q") ?? "";
  // La key reinicia la lista y el buscador cuando cambia la búsqueda global.
  return <ListaVehiculos key={consulta} consulta={consulta} />;
}

export default function VehiculosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <VehiculosConBusqueda />
    </Suspense>
  );
}
