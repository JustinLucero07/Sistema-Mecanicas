"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, X, CheckCircle2, AlertCircle, RefreshCw, Zap, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { PlacaDetectada } from "@/lib/types";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScannerModal({ isOpen, onClose }: ScannerModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultado, setResultado] = useState<PlacaDetectada | null>(null);
  const [placaEditada, setPlacaEditada] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setResultado(null);
      setError(null);
      setLoading(false);
      setPlacaEditada("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function procesarArchivo(file: File) {
    setError(null);
    setLoading(true);
    setResultado(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("foto", file);
      const res = await api.postForm<PlacaDetectada>("/api/vehiculos/escanear-placa", formData);
      setResultado(res);
      setPlacaEditada(res.placa_texto);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al procesar la imagen de la placa.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  }

  // Simulación para prueba rápida con la placa de demostración del seed
  async function simularDemo(placaDemo: string = "ABC-1234") {
    setLoading(true);
    setError(null);
    setPreviewUrl("https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80");
    try {
      // Búsqueda directa del vehículo para el demo rápido
      const vehiculo = await api.get<any>(`/api/vehiculos/by-placa/${placaDemo}`).catch(() => null);
      setResultado({
        placa_texto: placaDemo,
        confianza: 0.98,
        vehiculo: vehiculo,
        foto_url: "",
      });
      setPlacaEditada(placaDemo);
    } catch (err) {
      setError("No se pudo cargar la simulación");
    } finally {
      setLoading(false);
    }
  }

  function irAlVehiculo() {
    if (resultado?.vehiculo?.id) {
      onClose();
      router.push(`/vehiculos/${resultado.vehiculo.id}`);
    } else if (placaEditada) {
      onClose();
      router.push(`/vehiculos/nuevo?placa=${encodeURIComponent(placaEditada)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel border border-slate-700/60 shadow-2xl">
        {/* Cabecera Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Reconocimiento Óptico de Placas (LPR)
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AI Visión
                </span>
              </h3>
              <p className="text-xs text-slate-400">Apunta a la placa para identificar el vehículo automáticamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor / Área de Escaneo */}
        <div className="p-6 space-y-5">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center group">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
            ) : (
              <div className="p-6 flex flex-col items-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800 mb-1">
                  <Camera className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-sm font-medium text-slate-200">Enfoca la placa del vehículo</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Sube una foto clara de la matrícula delantera o trasera
                </p>
              </div>
            )}

            {/* Guías de encuadre HUD */}
            <div className="absolute inset-4 pointer-events-none border border-slate-700/40 rounded-lg">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-orange-500 rounded-tl"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-orange-500 rounded-tr"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-orange-500 rounded-br"></div>

              {/* Láser de Escaneo */}
              {loading && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_12px_#f97316] animate-laser"></div>
              )}
            </div>

            {loading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-slate-200">
                <RefreshCw className="w-7 h-7 text-orange-400 animate-spin" />
                <span className="text-xs font-mono tracking-wide text-orange-300">ANALIZANDO OCR Y MODELO...</span>
              </div>
            )}
          </div>

          {/* Resultado de la Detección */}
          {resultado && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Placa Detectada:</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {(resultado.confianza * 100).toFixed(0)}% confianza
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="plate-badge px-4 py-1.5 text-xl font-bold rounded-md">
                  {placaEditada || resultado.placa_texto}
                </div>
                <input
                  type="text"
                  value={placaEditada}
                  onChange={(e) => setPlacaEditada(e.target.value.toUpperCase())}
                  placeholder="Editar placa..."
                  className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm font-mono text-slate-200 uppercase focus:outline-none focus:border-orange-500"
                />
              </div>

              {resultado.vehiculo ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="font-bold">{resultado.vehiculo.marca} {resultado.vehiculo.modelo} ({resultado.vehiculo.anio})</span>
                    <p className="text-emerald-400/80">Propietario: {resultado.vehiculo.cliente?.nombre || "Registrado"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                    En Base de Datos
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Vehículo no registrado en la base de datos. ¿Deseas ingresarlo ahora?</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!resultado ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-lg shadow-orange-600/20 transition-all active:scale-98 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Tomar Foto
                </button>
                <button
                  onClick={() => simularDemo("ABC-1234")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  Demo (ABC-1234)
                </button>
              </div>
            ) : (
              <button
                onClick={irAlVehiculo}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all"
              >
                {resultado.vehiculo ? "Abrir Historial Clínico" : "Registrar Nuevo Vehículo"}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
