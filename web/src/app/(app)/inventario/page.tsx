"use client";

import { useEffect, useState } from "react";
import { Boxes, Plus, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatoMoneda } from "@/lib/format";
import type { Repuesto } from "@/lib/types";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Tabs, Td, Th } from "@/components/ui";

type Filtro = "todos" | "por_reponer";

const FORM_VACIO = { nombre: "", codigo: "", marca: "", categoria: "", ubicacion: "", costo_compra: "", precio_venta: "", stock_actual: "0", stock_minimo: "2" };

export default function InventarioPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [error, setError] = useState<string | null>(null);

  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [ajuste, setAjuste] = useState<Repuesto | null>(null);
  const [movimiento, setMovimiento] = useState({ tipo: "entrada", cantidad: "" });
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api
      .get<Repuesto[]>("/api/inventario/repuestos")
      .then(setRepuestos)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el inventario."));
  }

  useEffect(cargar, []);

  const set = (campo: keyof typeof FORM_VACIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  async function guardar(accion: () => Promise<unknown>, alTerminar: () => void) {
    setErrorForm(null);
    setGuardando(true);
    try {
      await accion();
      alTerminar();
      cargar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function crearRepuesto(e: React.FormEvent) {
    e.preventDefault();
    guardar(
      () =>
        api.post("/api/inventario/repuestos", {
          nombre: form.nombre.trim(),
          codigo: form.codigo.trim() || null,
          marca: form.marca.trim() || null,
          categoria: form.categoria.trim() || null,
          ubicacion: form.ubicacion.trim() || null,
          costo_compra: Number(form.costo_compra || 0),
          precio_venta: Number(form.precio_venta || 0),
          stock_actual: Number(form.stock_actual || 0),
          stock_minimo: Number(form.stock_minimo || 0),
        }),
      () => {
        setForm(FORM_VACIO);
        setNuevoOpen(false);
      },
    );
  }

  function registrarMovimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!ajuste) return;
    guardar(
      () =>
        api.post("/api/inventario/movimientos", {
          repuesto_id: ajuste.id,
          tipo: movimiento.tipo,
          motivo: movimiento.tipo === "entrada" ? "compra" : "ajuste_inventario",
          cantidad: Number(movimiento.cantidad),
        }),
      () => {
        setAjuste(null);
        setMovimiento({ tipo: "entrada", cantidad: "" });
      },
    );
  }

  const lista = repuestos ?? [];
  const porReponer = lista.filter((r) => r.stock_actual <= r.stock_minimo);
  const q = busqueda.trim().toLowerCase();
  const visibles = (filtro === "por_reponer" ? porReponer : lista).filter(
    (r) => !q || [r.nombre, r.codigo, r.sku, r.marca, r.categoria].some((v) => v?.toLowerCase().includes(q)),
  );
  const valorInventario = lista.reduce((s, r) => s + r.stock_actual * r.costo_compra, 0);

  return (
    <>
      <PageHeader
        title="Inventario"
        description={
          repuestos
            ? `${lista.length} repuestos, ${formatoMoneda(valorInventario)} en stock a precio de costo.`
            : "Repuestos e insumos del taller."
        }
        actions={
          <Button icon={Plus} onClick={() => setNuevoOpen(true)}>
            Nuevo repuesto
          </Button>
        }
      />

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, código o marca" aria-label="Buscar repuesto" className="pl-9" />
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="px-3 pt-1">
          <Tabs
            value={filtro}
            onChange={setFiltro}
            items={[
              { value: "todos", label: "Todos", count: lista.length },
              { value: "por_reponer", label: "Por reponer", count: porReponer.length },
            ]}
          />
        </div>

        {repuestos === null && !error ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : visibles.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={filtro === "por_reponer" && !q ? "Ningún repuesto por reponer" : q ? `Nada coincide con “${busqueda}”` : "El inventario está vacío"}
            description={filtro === "por_reponer" && !q ? "Todo el stock está por encima de su mínimo." : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead className="border-b border-line">
                <tr>
                  <Th>Repuesto</Th>
                  <Th>Ubicación</Th>
                  <Th className="text-right">Costo</Th>
                  <Th className="text-right">Precio</Th>
                  <Th className="text-right">Stock</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((r) => {
                  const bajo = r.stock_actual <= r.stock_minimo;
                  return (
                    <tr key={r.id}>
                      <Td>
                        <p className="font-semibold">{r.nombre}</p>
                        <p className="text-[0.87rem] text-ink-3">{[r.codigo ?? r.sku, r.marca, r.categoria].filter(Boolean).join(" · ") || "Sin código"}</p>
                      </Td>
                      <Td className="text-ink-2">{r.ubicacion ?? "—"}</Td>
                      <Td className="text-right text-ink-2">{formatoMoneda(r.costo_compra)}</Td>
                      <Td className="text-right font-semibold">{formatoMoneda(r.precio_venta)}</Td>
                      <Td className="text-right">
                        <span className="font-display text-xl font-semibold">{r.stock_actual}</span>
                        <span className="ml-1 text-[0.87rem] text-ink-3">mín. {r.stock_minimo}</span>
                        {bajo && (
                          <div className="mt-0.5">
                            <Badge tone={r.stock_actual <= 0 ? "bad" : "warn"}>{r.stock_actual <= 0 ? "Agotado" : "Por reponer"}</Badge>
                          </div>
                        )}
                      </Td>
                      <Td className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => setAjuste(r)}>
                          Mover stock
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Nuevo repuesto" width="max-w-xl">
        <form onSubmit={crearRepuesto} className="space-y-4">
          <Field label="Nombre">
            <Input required autoFocus value={form.nombre} onChange={set("nombre")} placeholder="Filtro de aceite" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código">
              <Input value={form.codigo} onChange={set("codigo")} />
            </Field>
            <Field label="Marca">
              <Input value={form.marca} onChange={set("marca")} />
            </Field>
            <Field label="Categoría">
              <Input value={form.categoria} onChange={set("categoria")} placeholder="Filtros" />
            </Field>
            <Field label="Ubicación en bodega">
              <Input value={form.ubicacion} onChange={set("ubicacion")} placeholder="Estante A3" />
            </Field>
            <Field label="Costo de compra">
              <Input type="number" min={0} step="0.01" value={form.costo_compra} onChange={set("costo_compra")} />
            </Field>
            <Field label="Precio de venta">
              <Input type="number" min={0} step="0.01" required value={form.precio_venta} onChange={set("precio_venta")} />
            </Field>
            <Field label="Stock inicial">
              <Input type="number" min={0} value={form.stock_actual} onChange={set("stock_actual")} />
            </Field>
            <Field label="Stock mínimo" hint="Por debajo de este número se marca por reponer.">
              <Input type="number" min={0} value={form.stock_minimo} onChange={set("stock_minimo")} />
            </Field>
          </div>
          {errorForm && <Alert>{errorForm}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setNuevoOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar repuesto"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={ajuste !== null} onClose={() => setAjuste(null)} title="Mover stock" description={ajuste ? `${ajuste.nombre} · hay ${ajuste.stock_actual}` : undefined} width="max-w-md">
        <form onSubmit={registrarMovimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Movimiento">
              <Select value={movimiento.tipo} onChange={(e) => setMovimiento((m) => ({ ...m, tipo: e.target.value }))}>
                <option value="entrada">Entrada por compra</option>
                <option value="salida">Salida por ajuste</option>
              </Select>
            </Field>
            <Field label="Cantidad">
              <Input type="number" min={1} required autoFocus value={movimiento.cantidad} onChange={(e) => setMovimiento((m) => ({ ...m, cantidad: e.target.value }))} />
            </Field>
          </div>
          {errorForm && <Alert>{errorForm}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setAjuste(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Registrar movimiento"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
