import type { EstadoOrden } from "@/lib/types";

const moneda = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });
const entero = new Intl.NumberFormat("es-EC");

export function formatoMoneda(valor: number | null | undefined): string {
  return moneda.format(Number(valor ?? 0));
}

export function formatoKm(valor: number | null | undefined): string {
  return valor == null ? "Sin registro" : `${entero.format(valor)} km`;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}

export function formatoPct(valor: number | null): string | null {
  if (valor === null) return null;
  return `${valor > 0 ? "+" : ""}${valor.toFixed(0)}%`;
}

export function formatoFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
}

export function formatoFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-EC", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nombreVehiculo(v?: { marca: string | null; modelo: string | null; anio: number | null } | null): string {
  if (!v) return "Vehículo";
  return [v.marca, v.modelo, v.anio].filter(Boolean).join(" ") || "Sin marca ni modelo";
}

export function nombreCliente(c?: { nombre: string; apellidos?: string | null } | null): string {
  if (!c) return "Sin cliente";
  return [c.nombre, c.apellidos].filter(Boolean).join(" ");
}

export function etiqueta(valor: string): string {
  const texto = valor.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export type Tono = "neutral" | "brand" | "ok" | "warn" | "bad" | "info";

/** Orden real del flujo de una orden de trabajo en el taller. */
export const FLUJO_ORDEN: EstadoOrden[] = [
  "recepcion",
  "diagnostico",
  "esperando_aprobacion",
  "esperando_repuestos",
  "en_reparacion",
  "control_calidad",
  "listo_para_entregar",
  "entregado",
];

export const ESTADOS_ORDEN: Record<string, { label: string; tono: Tono }> = {
  recepcion: { label: "Recepción", tono: "info" },
  diagnostico: { label: "Diagnóstico", tono: "info" },
  esperando_aprobacion: { label: "Esperando aprobación", tono: "warn" },
  esperando_repuestos: { label: "Esperando repuestos", tono: "warn" },
  en_reparacion: { label: "En reparación", tono: "brand" },
  control_calidad: { label: "Control de calidad", tono: "brand" },
  listo_para_entregar: { label: "Listo para entregar", tono: "ok" },
  entregado: { label: "Entregado", tono: "neutral" },
  cancelado: { label: "Cancelado", tono: "bad" },
  pendiente: { label: "Recepción", tono: "info" },
  en_proceso: { label: "En reparación", tono: "brand" },
  completado: { label: "Listo para entregar", tono: "ok" },
};

export function estadoOrden(estado: string) {
  return ESTADOS_ORDEN[estado] ?? { label: etiqueta(estado), tono: "neutral" as Tono };
}
