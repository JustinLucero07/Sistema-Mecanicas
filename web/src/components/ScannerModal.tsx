"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { nombreCliente, nombreVehiculo } from "@/lib/format";
import type { PlacaDetectada, Vehiculo } from "@/lib/types";
import { Alert, Button, Modal, Plate } from "@/components/ui";

type Busqueda = { placa: string; vehiculo: Vehiculo | null };

export default function ScannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Se monta solo al abrir, así cada escaneo empieza limpio.
  return open ? <Escaner onClose={onClose} /> : null;
}

function Escaner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [placa, setPlaca] = useState("");
  const [confianza, setConfianza] = useState<number | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Busqueda | null>(null);

  async function leerFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setResultado(null);
    setLeyendo(true);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      const res = await api.postForm<PlacaDetectada>("/api/vehiculos/escanear-placa", formData);
      // Nunca se busca directo: la persona confirma o corrige lo que leyó el OCR.
      setPlaca(res.placa_texto);
      setConfianza(res.confianza);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? "La lectura automática aún no está instalada en este servidor. Escribe la placa a mano."
          : err instanceof ApiError
            ? err.message
            : "No se pudo leer la foto. Escribe la placa a mano.",
      );
    } finally {
      setLeyendo(false);
    }
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const texto = placa.trim().toUpperCase();
    if (!texto) return;
    setError(null);
    setBuscando(true);
    try {
      const vehiculo = await api.get<Vehiculo>(`/api/vehiculos/placa/${encodeURIComponent(texto)}`);
      setResultado({ placa: vehiculo.placa, vehiculo });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setResultado({ placa: texto, vehiculo: null });
      else setError(err instanceof ApiError ? err.message : "No se pudo buscar la placa.");
    } finally {
      setBuscando(false);
    }
  }

  function ir(ruta: string) {
    onClose();
    router.push(ruta);
  }

  return (
    <Modal open onClose={onClose} title="Identificar vehículo" description="Toma una foto de la placa o escríbela.">
      <div className="space-y-5">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={leerFoto} />
        <Button variant="secondary" size="lg" icon={Camera} className="w-full" disabled={leyendo} onClick={() => fileRef.current?.click()}>
          {leyendo ? "Leyendo la placa…" : "Tomar foto de la placa"}
        </Button>

        <form onSubmit={buscar} className="space-y-2">
          <label htmlFor="placa-manual" className="block text-[0.87rem] font-semibold text-ink-2">
            Placa
          </label>
          <div className="flex gap-2">
            <input
              id="placa-manual"
              value={placa}
              onChange={(e) => {
                setPlaca(e.target.value.toUpperCase());
                setResultado(null);
              }}
              placeholder="ABC-1234"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-4 font-display text-2xl font-semibold tracking-wider uppercase placeholder:text-ink-3/60 focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none"
            />
            <Button type="submit" size="lg" icon={Search} disabled={!placa.trim() || buscando}>
              {buscando ? "Buscando…" : "Buscar"}
            </Button>
          </div>
          {confianza !== null && !resultado && (
            <p className="text-[0.87rem] text-ink-3">
              Leída de la foto con {Math.round(confianza * 100)}% de confianza. Revísala antes de buscar.
            </p>
          )}
        </form>

        {error && <Alert tone="warn">{error}</Alert>}

        {resultado?.vehiculo && (
          <div className="rounded-xl border border-line bg-raised p-4">
            <div className="flex items-center gap-4">
              <Plate placa={resultado.vehiculo.placa} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{nombreVehiculo(resultado.vehiculo)}</p>
                <p className="truncate text-[0.87rem] text-ink-3">{nombreCliente(resultado.vehiculo.cliente)}</p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={() => ir(`/vehiculos/${resultado.vehiculo!.id}`)}>
              Abrir historial
            </Button>
          </div>
        )}

        {resultado && !resultado.vehiculo && (
          <div className="rounded-xl border border-line bg-raised p-4">
            <p className="font-semibold text-ink">No hay ningún vehículo con la placa {resultado.placa}</p>
            <p className="mt-1 text-[0.87rem] text-ink-3">Regístralo para abrirle una orden de trabajo.</p>
            <Button className="mt-4 w-full" onClick={() => ir(`/vehiculos/nuevo?placa=${encodeURIComponent(resultado.placa)}`)}>
              Registrar vehículo
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
