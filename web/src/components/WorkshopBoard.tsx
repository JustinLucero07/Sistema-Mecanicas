import Link from "next/link";
import { estadoOrden, nombreCliente, nombreVehiculo } from "@/lib/format";
import type { OrdenTrabajo } from "@/lib/types";
import { Badge, Plate } from "@/components/ui";

const COLUMNAS: { titulo: string; estados: string[] }[] = [
  { titulo: "Recepción y diagnóstico", estados: ["recepcion", "diagnostico", "esperando_aprobacion", "pendiente"] },
  { titulo: "En reparación", estados: ["en_reparacion", "esperando_repuestos", "en_proceso"] },
  { titulo: "Control de calidad", estados: ["control_calidad"] },
  { titulo: "Listo para entregar", estados: ["listo_para_entregar", "completado"] },
];

// Solo estos estados se muestran en la tarjeta: son los que bloquean el trabajo.
const EN_ESPERA = ["esperando_aprobacion", "esperando_repuestos"];

function diasEnTaller(fechaIngreso: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaIngreso).getTime()) / 86_400_000);
  if (dias <= 0) return "Ingresó hoy";
  return dias === 1 ? "1 día en taller" : `${dias} días en taller`;
}

export default function WorkshopBoard({ ordenes }: { ordenes: OrdenTrabajo[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNAS.map((columna) => {
        const items = ordenes.filter((o) => columna.estados.includes(o.estado));
        return (
          <section key={columna.titulo} className="flex flex-col rounded-xl bg-raised p-2.5">
            <header className="flex items-baseline justify-between px-2 pt-1.5 pb-3">
              <h3 className="font-semibold text-ink">{columna.titulo}</h3>
              <span className="font-display text-xl font-semibold text-ink-3">{items.length}</span>
            </header>

            <div className="flex flex-col gap-2">
              {items.map((orden) => (
                <Link
                  key={orden.id}
                  href={`/ordenes/${orden.id}`}
                  className="group rounded-lg border border-line bg-surface p-3 transition-colors hover:border-brand"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Plate placa={orden.vehiculo?.placa ?? "—"} size="sm" />
                    <span className="text-[0.8rem] text-ink-3">{orden.numero_orden ?? `OT-${orden.id}`}</span>
                  </div>
                  <p className="mt-2.5 truncate font-semibold text-ink">{nombreVehiculo(orden.vehiculo)}</p>
                  <p className="truncate text-[0.87rem] text-ink-3">{nombreCliente(orden.cliente ?? orden.vehiculo?.cliente)}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.8rem] text-ink-3">
                    {EN_ESPERA.includes(orden.estado) && (
                      <Badge tone={estadoOrden(orden.estado).tono}>{estadoOrden(orden.estado).label}</Badge>
                    )}
                    <span>{orden.mecanico?.nombre ?? "Sin mecánico"}</span>
                    <span aria-hidden>·</span>
                    <span>{diasEnTaller(orden.fecha_ingreso)}</span>
                  </div>
                </Link>
              ))}
              {items.length === 0 && <p className="px-2 pb-3 text-[0.87rem] text-ink-3">Ningún vehículo aquí.</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
