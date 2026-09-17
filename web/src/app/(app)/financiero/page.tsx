"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatoMoneda } from "@/lib/format";

interface Ingreso {
  id: number;
  concepto: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
}

interface Egreso {
  id: number;
  categoria: string;
  descripcion: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
}

interface Caja {
  id: number;
  fecha: string;
  monto_apertura: number;
  monto_cierre_esperado: number | null;
  monto_cierre_real: number | null;
  diferencia: number | null;
  cerrada: boolean;
}

const CATEGORIAS_EGRESO = [
  "nomina", "repuestos", "alquiler", "servicios_basicos", "herramientas",
  "impuestos", "marketing", "mantenimiento_local", "otros",
];

type Tab = "ingresos" | "egresos" | "caja";

export default function FinancieroPage() {
  const [tab, setTab] = useState<Tab>("ingresos");
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [caja, setCaja] = useState<Caja | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [formIngreso, setFormIngreso] = useState({ concepto: "", monto: "", metodo_pago: "efectivo" });
  const [formEgreso, setFormEgreso] = useState({ categoria: "repuestos", descripcion: "", monto: "", metodo_pago: "efectivo" });
  const [montoApertura, setMontoApertura] = useState("");
  const [montoCierre, setMontoCierre] = useState("");

  function cargarTodo() {
    api.get<Ingreso[]>("/api/financiero/ingresos").then(setIngresos).catch(() => {});
    api.get<Egreso[]>("/api/financiero/egresos").then(setEgresos).catch(() => {});
    api.get<Caja | null>("/api/financiero/caja/hoy").then(setCaja).catch(() => setCaja(null));
  }

  useEffect(cargarTodo, []);

  async function registrarIngreso(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/financiero/ingresos", {
        concepto: formIngreso.concepto,
        monto: Number(formIngreso.monto),
        metodo_pago: formIngreso.metodo_pago,
      });
      setFormIngreso({ concepto: "", monto: "", metodo_pago: "efectivo" });
      cargarTodo();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el ingreso");
    }
  }

  async function registrarEgreso(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/financiero/egresos", {
        categoria: formEgreso.categoria,
        descripcion: formEgreso.descripcion,
        monto: Number(formEgreso.monto),
        metodo_pago: formEgreso.metodo_pago,
      });
      setFormEgreso({ categoria: "repuestos", descripcion: "", monto: "", metodo_pago: "efectivo" });
      cargarTodo();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el egreso");
    }
  }

  async function abrirCaja(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/financiero/caja/abrir", { monto_apertura: Number(montoApertura) });
      setMontoApertura("");
      cargarTodo();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo abrir la caja");
    }
  }

  async function cerrarCaja(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/financiero/caja/cerrar", { monto_cierre_real: Number(montoCierre) });
      setMontoCierre("");
      cargarTodo();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cerrar la caja");
    }
  }

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-orange-400" />
            Finanzas & Control de Caja Diaria
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de cobros, egresos operativos, y arqueo de turnos de caja
          </p>
        </div>

        {/* Resumen Superior Rápido */}
        <div className="flex items-center gap-3 text-xs">
          <div className="p-2.5 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Ingresos:</span>
              <span className="font-mono font-bold text-emerald-400">{formatoMoneda(totalIngresos)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Egresos:</span>
              <span className="font-mono font-bold text-rose-400">{formatoMoneda(totalEgresos)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: "ingresos", label: `Ingresos (${ingresos.length})`, icon: TrendingUp },
          { id: "egresos", label: `Egresos (${egresos.length})`, icon: TrendingDown },
          { id: "caja", label: "Caja Diaria / Turno", icon: Wallet },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                active
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PESTAÑA: INGRESOS */}
      {tab === "ingresos" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={registrarIngreso}
            className="rounded-2xl glass-panel border border-slate-800/80 p-5 space-y-4 shadow-xl"
          >
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Registrar Nuevo Ingreso
              </h2>
              <p className="text-[11px] text-slate-400">Cobro de servicio, anticipo o venta rápida</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Concepto / Glosa</label>
              <input
                required
                placeholder="Ej: Mano de obra cambio pastillas freno"
                value={formIngreso.concepto}
                onChange={(e) => setFormIngreso({ ...formIngreso, concepto: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Monto ($ USD)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formIngreso.monto}
                onChange={(e) => setFormIngreso({ ...formIngreso, monto: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Método de Pago</label>
              <select
                value={formIngreso.metodo_pago}
                onChange={(e) => setFormIngreso({ ...formIngreso, metodo_pago: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta Débito/Crédito</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Registrar Ingreso
            </button>
          </form>

          {/* Tabla de Ingresos */}
          <div className="lg:col-span-2 rounded-2xl glass-panel border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Libro de Ingresos Recientes
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Total: {ingresos.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-950/60 text-slate-400 text-left border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Concepto</th>
                    <th className="px-4 py-3 font-semibold">Método</th>
                    <th className="px-4 py-3 font-semibold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ingresos.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(i.fecha).toLocaleDateString("es-EC")}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{i.concepto}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono capitalize">
                          {i.metodo_pago}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        +{formatoMoneda(i.monto)}
                      </td>
                    </tr>
                  ))}
                  {ingresos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        No hay ingresos registrados en el período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: EGRESOS */}
      {tab === "egresos" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={registrarEgreso}
            className="rounded-2xl glass-panel border border-slate-800/80 p-5 space-y-4 shadow-xl"
          >
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" />
                Registrar Nuevo Egreso
              </h2>
              <p className="text-[11px] text-slate-400">Compra de repuestos, sueldos o servicios del local</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Categoría de Gasto</label>
              <select
                value={formEgreso.categoria}
                onChange={(e) => setFormEgreso({ ...formEgreso, categoria: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 capitalize"
              >
                {CATEGORIAS_EGRESO.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Descripción / Proveedor</label>
              <input
                required
                placeholder="Ej: Compra de 5 galones aceite 20W50"
                value={formEgreso.descripcion}
                onChange={(e) => setFormEgreso({ ...formEgreso, descripcion: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Monto ($ USD)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formEgreso.monto}
                onChange={(e) => setFormEgreso({ ...formEgreso, monto: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Método de Pago</label>
              <select
                value={formEgreso.metodo_pago}
                onChange={(e) => setFormEgreso({ ...formEgreso, metodo_pago: e.target.value })}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              Registrar Egreso
            </button>
          </form>

          {/* Tabla de Egresos */}
          <div className="lg:col-span-2 rounded-2xl glass-panel border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Libro de Egresos Recientes
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Total: {egresos.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-950/60 text-slate-400 text-left border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Descripción</th>
                    <th className="px-4 py-3 font-semibold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {egresos.map((eg) => (
                    <tr key={eg.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(eg.fecha).toLocaleDateString("es-EC")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono capitalize">
                          {eg.categoria.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{eg.descripcion}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        -{formatoMoneda(eg.monto)}
                      </td>
                    </tr>
                  ))}
                  {egresos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        No hay egresos registrados en el período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: CONTROL DE CAJA DIARIA */}
      {tab === "caja" && (
        <div className="max-w-xl mx-auto space-y-6">
          {caja === undefined && (
            <div className="h-48 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
          )}

          {/* Caja sin abrir */}
          {caja === null && (
            <form
              onSubmit={abrirCaja}
              className="rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Unlock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Apertura de Caja Diaria</h2>
                  <p className="text-xs text-slate-400">
                    Registra el fondo base en efectivo para comenzar la jornada de hoy.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Monto de Apertura en Efectivo ($ USD)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all"
              >
                Abrir Caja del Taller
              </button>
            </form>
          )}

          {/* Caja Abierta */}
          {caja && !caja.cerrada && (
            <div className="rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Caja Diaria Abierta
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h2>
                    <p className="text-xs text-slate-400">
                      Fecha: {new Date(caja.fecha).toLocaleDateString("es-EC")}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Fondo Apertura:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {formatoMoneda(caja.monto_apertura)}
                  </span>
                </div>
              </div>

              {/* Formulario de Cierre de Caja */}
              <form onSubmit={cerrarCaja} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Arqueo de Efectivo al Cierre ($ USD Real en Gaveta)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Monto contado físicamente al cerrar..."
                    value={montoCierre}
                    onChange={(e) => setMontoCierre(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    El sistema calculará automáticamente la diferencia con los ingresos y egresos registrados.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Cuadrar y Cerrar Caja Diaria
                </button>
              </form>
            </div>
          )}

          {/* Caja Cerrada */}
          {caja && caja.cerrada && (
            <div className="rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Caja Cerrada — Turno Completado</h2>
                  <p className="text-xs text-slate-400">
                    Fecha: {new Date(caja.fecha).toLocaleDateString("es-EC")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Apertura:</span>
                  <p className="text-sm font-mono font-bold text-slate-200">
                    {formatoMoneda(caja.monto_apertura)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Esperado al Cierre:</span>
                  <p className="text-sm font-mono font-bold text-slate-200">
                    {formatoMoneda(caja.monto_cierre_esperado ?? 0)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Real en Gaveta:</span>
                  <p className="text-sm font-mono font-bold text-slate-200">
                    {formatoMoneda(caja.monto_cierre_real ?? 0)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Diferencia:</span>
                  <p
                    className={`text-sm font-mono font-bold ${
                      Number(caja.diferencia) === 0
                        ? "text-emerald-400"
                        : Number(caja.diferencia) > 0
                        ? "text-blue-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatoMoneda(caja.diferencia ?? 0)}
                  </p>
                </div>
              </div>

              {Number(caja.diferencia) === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Arqueo perfecto: No hay diferencias entre el saldo esperado y el efectivo real.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Se detectó una discrepancia en el conteo de efectivo al cierre.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
