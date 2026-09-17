"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  X,
  Tag,
  Boxes,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatoMoneda } from "@/lib/format";

interface Repuesto {
  id: number;
  codigo?: string | null;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  precio_costo?: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  ubicacion?: string | null;
}

export default function InventarioPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroBajoStock, setFiltroBajoStock] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    marca: "",
    categoria: "repuesto",
    precio_costo: "",
    precio_venta: "",
    stock_actual: "0",
    stock_minimo: "2",
    ubicacion: "",
  });

  function cargar() {
    setLoading(true);
    api
      .get<Repuesto[]>("/api/inventario/repuestos")
      .then(setRepuestos)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar inventario"))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  async function onSubmitNuevo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await api.post("/api/inventario/repuestos", {
        codigo: form.codigo || null,
        nombre: form.nombre,
        marca: form.marca || null,
        categoria: form.categoria || null,
        precio_costo: form.precio_costo ? Number(form.precio_costo) : 0,
        precio_venta: Number(form.precio_venta),
        stock_actual: Number(form.stock_actual || "0"),
        stock_minimo: Number(form.stock_minimo || "2"),
        ubicacion: form.ubicacion || null,
      });
      setForm({
        codigo: "",
        nombre: "",
        marca: "",
        categoria: "repuesto",
        precio_costo: "",
        precio_venta: "",
        stock_actual: "0",
        stock_minimo: "2",
        ubicacion: "",
      });
      setMostrarModalNuevo(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el repuesto");
    } finally {
      setGuardando(false);
    }
  }

  const filtrados = repuestos.filter((r) => {
    const coincideTexto =
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.codigo && r.codigo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (r.marca && r.marca.toLowerCase().includes(busqueda.toLowerCase()));

    if (filtroBajoStock) {
      return coincideTexto && r.stock_actual <= r.stock_minimo;
    }
    return coincideTexto;
  });

  const repuestosBajos = repuestos.filter((r) => r.stock_actual <= r.stock_minimo);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" />
            Catálogo de Repuestos & Kardex de Almacén
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control de inventario por sucursal, existencias mínimas y trazabilidad de piezas
          </p>
        </div>

        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Nuevo Repuesto / Insumo
        </button>
      </div>

      {/* Alerta de Stock Bajo Banner */}
      {repuestosBajos.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <span>
              Existen <strong>{repuestosBajos.length} repuestos</strong> con stock igual o inferior al umbral mínimo de seguridad.
            </span>
          </div>
          <button
            onClick={() => setFiltroBajoStock(!filtroBajoStock)}
            className="underline font-bold hover:text-amber-800 dark:hover:text-amber-200"
          >
            {filtroBajoStock ? "Mostrar todos" : "Filtrar críticos"}
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código SKU o marca..."
            className="w-full rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFiltroBajoStock(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !filtroBajoStock
                ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Todos ({repuestos.length})
          </button>
          <button
            onClick={() => setFiltroBajoStock(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filtroBajoStock
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Stock Crítico ({repuestosBajos.length})
          </button>
        </div>
      </div>

      {error && !mostrarModalNuevo && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Tabla / Grid de Repuestos */}
      <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 text-left border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Código / SKU</th>
                <th className="px-4 py-3.5 font-semibold">Descripción del Repuesto</th>
                <th className="px-4 py-3.5 font-semibold">Marca</th>
                <th className="px-4 py-3.5 font-semibold text-center">Stock Actual</th>
                <th className="px-4 py-3.5 font-semibold text-right">Precio Venta</th>
                <th className="px-4 py-3.5 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filtrados.map((r) => {
                const bajoStock = r.stock_actual <= r.stock_minimo;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                      {r.codigo || "S/C"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">
                      {r.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {r.marca || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {r.stock_actual}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        mín. {r.stock_minimo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200">
                      {formatoMoneda(r.precio_venta)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bajoStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Stock Crítico
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Disponible
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No se encontraron repuestos con los filtros indicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Repuesto */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-slate-700/80 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-orange-400" />
                Registrar Nuevo Repuesto o Insumo
              </h3>
              <button
                onClick={() => setMostrarModalNuevo(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmitNuevo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Código / SKU</label>
                  <input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    placeholder="FILT-01"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Marca</label>
                  <input
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Bosch, Mobil, Denso..."
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nombre del Repuesto *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Pastillas de freno delanteras"
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Precio de Venta ($ USD) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.precio_venta}
                    onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                    placeholder="35.00"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Precio de Costo ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.precio_costo}
                    onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
                    placeholder="20.00"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Stock Inicial (unidades)</label>
                  <input
                    type="number"
                    value={form.stock_actual}
                    onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                    placeholder="10"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Stock Mínimo (alerta)</label>
                  <input
                    type="number"
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                    placeholder="2"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar Repuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
