"use client";

import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { etiqueta, formatoFechaHora } from "@/lib/format";
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Select, Skeleton } from "@/components/ui";

interface Registro {
  id: number;
  usuario_nombre: string | null;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  cambios: Record<string, unknown> | null;
  ip: string | null;
  creado_en: string;
}

const ENTIDADES: Record<string, string> = {
  clientes: "cliente",
  vehiculos: "vehículo",
  ordenes_trabajo: "orden de trabajo",
  detalle_ordenes: "línea de orden",
  checklists_recepcion: "recepción",
  ingresos: "ingreso",
  egresos: "egreso",
  caja_diaria: "caja",
  cuentas_por_cobrar: "cuenta por cobrar",
  cuentas_por_pagar: "cuenta por pagar",
  repuestos: "repuesto",
  movimientos_inventario: "movimiento de inventario",
  proveedores: "proveedor",
  usuarios: "usuario",
  organizaciones: "datos del taller",
  sucursales: "sucursal",
};

const ACCIONES: Record<string, { verbo: string; tono: "neutral" | "ok" | "info" | "bad" | "warn" }> = {
  crear: { verbo: "Creó", tono: "ok" },
  actualizar: { verbo: "Cambió", tono: "info" },
  eliminar: { verbo: "Eliminó", tono: "bad" },
  login: { verbo: "Inició sesión", tono: "neutral" },
  login_fallido: { verbo: "Intento de acceso fallido", tono: "warn" },
  exportar_datos: { verbo: "Exportó los datos de", tono: "warn" },
};

function valorLegible(v: unknown): string {
  if (v === null || v === undefined || v === "") return "vacío";
  if (typeof v === "boolean") return v ? "sí" : "no";
  return String(v);
}

function DetalleCambios({ registro }: { registro: Registro }) {
  if (registro.accion !== "actualizar" || !registro.cambios) return null;
  return (
    <ul className="mt-2 space-y-0.5 text-[0.87rem] text-ink-2">
      {Object.entries(registro.cambios).map(([campo, valor]) => {
        const { antes, despues } = (valor ?? {}) as { antes?: unknown; despues?: unknown };
        return (
          <li key={campo}>
            <span className="text-ink-3">{etiqueta(campo)}:</span> {valorLegible(antes)} → <span className="font-semibold text-ink">{valorLegible(despues)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function ActividadPage() {
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [entidad, setEntidad] = useState("");
  const [hayMas, setHayMas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (antesDe?: number) => {
      const params = new URLSearchParams({ limite: "50" });
      if (entidad) params.set("entidad", entidad);
      if (antesDe) params.set("antes_de", String(antesDe));
      try {
        const nuevos = await api.get<Registro[]>(`/api/auditoria?${params}`);
        setRegistros((prev) => (antesDe ? [...(prev ?? []), ...nuevos] : nuevos));
        setHayMas(nuevos.length === 50);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la actividad.");
      }
    },
    [entidad],
  );

  useEffect(() => {
    const params = new URLSearchParams({ limite: "50" });
    if (entidad) params.set("entidad", entidad);
    api
      .get<Registro[]>(`/api/auditoria?${params}`)
      .then((nuevos) => {
        setRegistros(nuevos);
        setHayMas(nuevos.length === 50);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar la actividad."));
  }, [entidad]);

  return (
    <>
      <PageHeader
        title="Actividad"
        description="Quién hizo qué y cuándo. Este registro no se puede editar ni borrar desde el sistema."
        actions={
          <Select value={entidad} onChange={(e) => { setRegistros(null); setEntidad(e.target.value); }} aria-label="Filtrar por tipo" className="w-56">
            <option value="">Todo</option>
            {Object.entries(ENTIDADES).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {etiqueta(label)}
              </option>
            ))}
          </Select>
        }
      />

      {error && <Alert>{error}</Alert>}

      <Card>
        {registros === null && !error ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : registros?.length === 0 ? (
          <EmptyState icon={History} title="Sin actividad registrada" />
        ) : (
          <ol className="divide-y divide-line">
            {registros?.map((r) => {
              const accion = ACCIONES[r.accion] ?? { verbo: etiqueta(r.accion), tono: "neutral" as const };
              const sobre = ENTIDADES[r.entidad] ?? r.entidad;
              const esSesion = r.accion.startsWith("login");
              return (
                <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3.5">
                  <time className="w-36 shrink-0 text-[0.87rem] text-ink-3">{formatoFechaHora(r.creado_en)}</time>
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-semibold">{r.usuario_nombre ?? (esSesion ? "Desconocido" : "Sistema")}</span>{" "}
                      <span className="text-ink-2">
                        {accion.verbo.toLowerCase()}
                        {!esSesion && ` ${sobre}`}
                        {!esSesion && r.entidad_id ? ` #${r.entidad_id}` : ""}
                      </span>
                    </p>
                    {r.accion === "login_fallido" && typeof r.cambios?.email === "string" && (
                      <p className="text-[0.87rem] text-ink-3">Correo usado: {r.cambios.email}</p>
                    )}
                    <DetalleCambios registro={r} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={accion.tono}>{accion.verbo}</Badge>
                    {r.ip && <span className="text-[0.8rem] text-ink-3">IP {r.ip}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {hayMas && registros && (
          <div className="border-t border-line p-4 text-center">
            <Button variant="secondary" onClick={() => cargar(registros[registros.length - 1].id)}>
              Ver más
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
