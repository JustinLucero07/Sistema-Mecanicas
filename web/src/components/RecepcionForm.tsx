"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatoKm, formatoMoneda } from "@/lib/format";
import type { OrdenTrabajo, Vehiculo } from "@/lib/types";
import { Alert, Button, Field, Input, Select, Textarea, cn } from "@/components/ui";

type Linea = { tipo: "mano_obra" | "repuesto"; descripcion: string; cantidad: string; precio_unitario: string };

const NIVELES = [
  { valor: 0, label: "Reserva" },
  { valor: 25, label: "1/4" },
  { valor: 50, label: "1/2" },
  { valor: 75, label: "3/4" },
  { valor: 100, label: "Lleno" },
];

const ACCESORIOS = [
  { clave: "radio", label: "Radio" },
  { clave: "herramientas", label: "Herramientas" },
  { clave: "gato_palanca", label: "Gato y palanca" },
  { clave: "llanta_emergencia", label: "Llanta de emergencia" },
  { clave: "antena", label: "Antena" },
  { clave: "documentos_vehiculo", label: "Matrícula en el vehículo" },
] as const;

type ClaveAccesorio = (typeof ACCESORIOS)[number]["clave"];

const lineaVacia = (): Linea => ({ tipo: "mano_obra", descripcion: "", cantidad: "1", precio_unitario: "" });

/** Recepción del vehículo: crea la orden de trabajo con su checklist de ingreso. */
export default function RecepcionForm({ vehiculo, onCancel }: { vehiculo: Vehiculo; onCancel: () => void }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [kilometraje, setKilometraje] = useState(vehiculo.kilometraje_actual ? String(vehiculo.kilometraje_actual) : "");
  const [combustible, setCombustible] = useState(50);
  const [accesorios, setAccesorios] = useState<Record<ClaveAccesorio, boolean>>({
    radio: true,
    herramientas: true,
    gato_palanca: true,
    llanta_emergencia: true,
    antena: true,
    documentos_vehiculo: false,
  });
  const [danos, setDanos] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const kmAnterior = vehiculo.kilometraje_actual;
  const kmMenor = !!kmAnterior && !!kilometraje && Number(kilometraje) < kmAnterior;
  const total = lineas.reduce((s, l) => s + Number(l.cantidad || 0) * Number(l.precio_unitario || 0), 0);

  function actualizar(idx: number, campo: keyof Linea, valor: string) {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const orden = await api.post<OrdenTrabajo>("/api/ordenes", {
        vehiculo_id: vehiculo.id,
        motivo_ingreso: motivo,
        kilometraje_ingreso: kilometraje ? Number(kilometraje) : null,
        detalles: lineas
          .filter((l) => l.descripcion.trim() && l.precio_unitario)
          .map((l) => ({
            tipo: l.tipo,
            descripcion: l.descripcion.trim(),
            cantidad: Number(l.cantidad || "1"),
            precio_unitario: Number(l.precio_unitario),
          })),
        checklist: { nivel_combustible: combustible, ...accesorios, observaciones_recepcion: danos.trim() || null },
      });
      router.push(`/ordenes/${orden.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la orden. Inténtalo de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Motivo de ingreso" hint="Lo que el cliente pide o el problema que describe.">
        <Textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Cambio de aceite y revisión de frenos" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kilometraje al ingresar" hint={kmAnterior ? `Última visita: ${formatoKm(kmAnterior)}` : undefined}>
          <Input type="number" min={0} inputMode="numeric" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-[0.87rem] font-semibold text-ink-2">Combustible</legend>
          <div className="grid h-10 grid-cols-5 overflow-hidden rounded-lg border border-line-strong">
            {NIVELES.map((n) => (
              <button
                key={n.valor}
                type="button"
                aria-pressed={combustible === n.valor}
                onClick={() => setCombustible(n.valor)}
                className={cn(
                  "border-l border-line-strong text-[0.87rem] font-semibold first:border-l-0",
                  combustible === n.valor ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-raised",
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {kmMenor && (
        <Alert tone="warn">
          El kilometraje es menor al de la última visita ({formatoKm(kmAnterior)}). Revisa el odómetro antes de guardar.
        </Alert>
      )}

      <fieldset>
        <legend className="mb-2 text-[0.87rem] font-semibold text-ink-2">El vehículo ingresa con</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACCESORIOS.map((a) => (
            <label key={a.clave} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 has-checked:border-brand has-checked:bg-brand-soft">
              <input
                type="checkbox"
                checked={accesorios[a.clave]}
                onChange={(e) => setAccesorios((prev) => ({ ...prev, [a.clave]: e.target.checked }))}
                className="size-4 accent-[var(--brand)]"
              />
              <span className="text-[0.93rem]">{a.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Daños visibles" hint="Rayones, golpes, vidrios o luces rotas. Protege al taller ante reclamos.">
        <Textarea value={danos} onChange={(e) => setDanos(e.target.value)} placeholder="Rayón en puerta trasera derecha" className="min-h-[4rem]" />
      </Field>

      <fieldset>
        <legend className="mb-2 text-[0.87rem] font-semibold text-ink-2">Trabajos y repuestos ya acordados</legend>
        <div className="space-y-2">
          {lineas.map((l, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-line p-2 sm:grid-cols-[9rem_1fr_4.5rem_6rem_auto] sm:border-0 sm:p-0">
              <Select value={l.tipo} onChange={(e) => actualizar(idx, "tipo", e.target.value)} aria-label="Tipo" className="max-sm:col-span-2">
                <option value="mano_obra">Mano de obra</option>
                <option value="repuesto">Repuesto</option>
              </Select>
              <Input value={l.descripcion} onChange={(e) => actualizar(idx, "descripcion", e.target.value)} placeholder="Descripción" aria-label="Descripción" className="max-sm:col-span-2" />
              <Input type="number" min={0} step="any" value={l.cantidad} onChange={(e) => actualizar(idx, "cantidad", e.target.value)} aria-label="Cantidad" />
              <Input type="number" min={0} step="0.01" value={l.precio_unitario} onChange={(e) => actualizar(idx, "precio_unitario", e.target.value)} placeholder="Precio" aria-label="Precio unitario" />
              <button type="button" onClick={() => setLineas((prev) => prev.filter((_, i) => i !== idx))} aria-label="Quitar línea" className="grid size-10 place-items-center rounded-lg text-ink-3 hover:bg-bad-soft hover:text-bad max-sm:col-start-2 max-sm:row-start-3">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => setLineas((prev) => [...prev, lineaVacia()])}>
            Agregar línea
          </Button>
          {lineas.length > 0 && <span className="font-semibold">Total estimado: {formatoMoneda(total)}</span>}
        </div>
      </fieldset>

      {error && <Alert>{error}</Alert>}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Creando orden…" : "Crear orden de trabajo"}
        </Button>
      </div>
    </form>
  );
}
