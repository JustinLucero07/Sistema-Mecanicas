"use client";

import { useEffect, useState } from "react";
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
  const [formEgreso, setFormEgreso] = useState({ categoria: "otros", descripcion: "", monto: "", metodo_pago: "efectivo" });
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
      setFormEgreso({ categoria: "otros", descripcion: "", monto: "", metodo_pago: "efectivo" });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Financiero</h1>
        <p className="text-sm text-slate-500">Ingresos, egresos y control de caja diaria</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {(["ingresos", "egresos", "caja"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === "ingresos" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={registrarIngreso} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-700">Registrar ingreso</h2>
            <input
              required
              placeholder="Concepto"
              value={formIngreso.concepto}
              onChange={(e) => setFormIngreso({ ...formIngreso, concepto: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              placeholder="Monto"
              value={formIngreso.monto}
              onChange={(e) => setFormIngreso({ ...formIngreso, monto: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={formIngreso.metodo_pago}
              onChange={(e) => setFormIngreso({ ...formIngreso, metodo_pago: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
            <button className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Registrar
            </button>
          </form>

          <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Concepto</th>
                  <th className="px-4 py-2">Método</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((i) => (
                  <tr key={i.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{new Date(i.fecha).toLocaleDateString("es-EC")}</td>
                    <td className="px-4 py-2">{i.concepto}</td>
                    <td className="px-4 py-2 capitalize">{i.metodo_pago}</td>
                    <td className="px-4 py-2 text-right text-emerald-600">{formatoMoneda(i.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "egresos" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={registrarEgreso} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-700">Registrar egreso</h2>
            <select
              value={formEgreso.categoria}
              onChange={(e) => setFormEgreso({ ...formEgreso, categoria: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm capitalize"
            >
              {CATEGORIAS_EGRESO.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Descripción"
              value={formEgreso.descripcion}
              onChange={(e) => setFormEgreso({ ...formEgreso, descripcion: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              placeholder="Monto"
              value={formEgreso.monto}
              onChange={(e) => setFormEgreso({ ...formEgreso, monto: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={formEgreso.metodo_pago}
              onChange={(e) => setFormEgreso({ ...formEgreso, metodo_pago: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
            <button className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
              Registrar
            </button>
          </form>

          <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {egresos.map((eg) => (
                  <tr key={eg.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{new Date(eg.fecha).toLocaleDateString("es-EC")}</td>
                    <td className="px-4 py-2 capitalize">{eg.categoria.replace("_", " ")}</td>
                    <td className="px-4 py-2">{eg.descripcion}</td>
                    <td className="px-4 py-2 text-right text-red-600">{formatoMoneda(eg.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "caja" && (
        <div className="max-w-md space-y-4">
          {caja === undefined && <p className="text-slate-500">Cargando...</p>}
          {caja === null && (
            <form onSubmit={abrirCaja} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-medium text-slate-700">Abrir caja de hoy</h2>
              <input
                required
                type="number"
                placeholder="Monto de apertura"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Abrir caja
              </button>
            </form>
          )}
          {caja && !caja.cerrada && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-medium text-slate-700">Caja abierta — {new Date(caja.fecha).toLocaleDateString("es-EC")}</h2>
              <p className="text-sm text-slate-600">Apertura: {formatoMoneda(caja.monto_apertura)}</p>
              <form onSubmit={cerrarCaja} className="space-y-3">
                <input
                  required
                  type="number"
                  placeholder="Monto real al cerrar"
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button className="w-full rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600">
                  Cerrar caja
                </button>
              </form>
            </div>
          )}
          {caja && caja.cerrada && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
              <h2 className="font-medium text-slate-700">Caja de hoy — cerrada</h2>
              <p>Apertura: {formatoMoneda(caja.monto_apertura)}</p>
              <p>Esperado al cierre: {formatoMoneda(caja.monto_cierre_esperado ?? 0)}</p>
              <p>Real al cierre: {formatoMoneda(caja.monto_cierre_real ?? 0)}</p>
              <p className={Number(caja.diferencia) === 0 ? "text-emerald-600" : "text-red-600"}>
                Diferencia: {formatoMoneda(caja.diferencia ?? 0)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
