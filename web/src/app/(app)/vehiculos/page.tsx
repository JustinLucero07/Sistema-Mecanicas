"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PlacaDetectada, Vehiculo } from "@/lib/types";

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [resultadoEscaneo, setResultadoEscaneo] = useState<PlacaDetectada | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function cargar(query?: string) {
    api
      .get<Vehiculo[]>(`/api/vehiculos${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then(setVehiculos)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar vehículos"));
  }

  useEffect(() => {
    cargar();
  }, []);

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    cargar(q);
  }

  async function onFotoSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    setEscaneando(true);
    setResultadoEscaneo(null);
    try {
      const formData = new FormData();
      formData.append("foto", archivo);
      const resultado = await api.postForm<PlacaDetectada>("/api/vehiculos/escanear-placa", formData);
      setResultadoEscaneo(resultado);
      if (resultado.vehiculo) {
        router.push(`/vehiculos/${resultado.vehiculo.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo escanear la placa");
    } finally {
      setEscaneando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Vehículos</h1>
          <p className="text-sm text-slate-500">Busca por placa o escanea una foto de la placa</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFotoSeleccionada}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={escaneando}
            className="rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {escaneando ? "Escaneando..." : "📷 Escanear placa"}
          </button>
          <a
            href="/vehiculos/nuevo"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nuevo vehículo
          </a>
        </div>
      </div>

      {resultadoEscaneo && !resultadoEscaneo.vehiculo && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          Se detectó la placa <strong>{resultadoEscaneo.placa_texto}</strong> (confianza{" "}
          {(resultadoEscaneo.confianza * 100).toFixed(0)}%) pero no hay ningún vehículo registrado con
          esa placa.{" "}
          <a
            className="underline"
            href={`/vehiculos/nuevo?placa=${encodeURIComponent(resultadoEscaneo.placa_texto)}`}
          >
            Registrarlo ahora
          </a>
        </div>
      )}

      <form onSubmit={onBuscar} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por placa..."
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
          Buscar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Placa</th>
              <th className="px-4 py-2">Marca / Modelo</th>
              <th className="px-4 py-2">Año</th>
              <th className="px-4 py-2">Cliente</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map((v) => (
              <tr
                key={v.id}
                onClick={() => router.push(`/vehiculos/${v.id}`)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-2 font-medium text-slate-900">{v.placa}</td>
                <td className="px-4 py-2">{[v.marca, v.modelo].filter(Boolean).join(" ") || "—"}</td>
                <td className="px-4 py-2">{v.anio ?? "—"}</td>
                <td className="px-4 py-2">{v.cliente?.nombre ?? "—"}</td>
              </tr>
            ))}
            {vehiculos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No hay vehículos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
