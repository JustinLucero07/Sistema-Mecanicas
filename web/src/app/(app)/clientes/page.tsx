"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Car,
  FileText,
  X,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Cliente } from "@/lib/types";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    cedula_ruc: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  function cargar() {
    setLoading(true);
    api
      .get<Cliente[]>("/api/clientes")
      .then(setClientes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar clientes"))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await api.post<Cliente>("/api/clientes", {
        nombre: form.nombre,
        cedula_ruc: form.cedula_ruc || null,
        telefono: form.telefono || null,
        email: form.email || null,
        direccion: form.direccion || null,
      });
      setForm({ nombre: "", cedula_ruc: "", telefono: "", email: "", direccion: "" });
      setMostrarModal(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el cliente");
    } finally {
      setGuardando(false);
    }
  }

  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.cedula_ruc && c.cedula_ruc.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Directorio de Clientes CRM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión de propietarios, flotas y canales de contacto rápido
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="w-full rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Grid de Clientes */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 p-12 text-center text-slate-500 space-y-2">
          <Users className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-300">No se encontraron clientes</p>
          <p className="text-xs">Intenta con otro término de búsqueda o crea uno nuevo con el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((c) => {
            const iniciales = c.nombre
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={c.id}
                className="rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-300 font-bold text-sm flex items-center justify-center">
                        {iniciales}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.nombre}</h3>
                        {c.cedula_ruc && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            ID: {c.cedula_ruc}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    {c.telefono && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.telefono}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.direccion && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{c.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de Contacto */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {c.telefono ? (
                    <a
                      href={`https://wa.me/${c.telefono.replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(c.nombre)},%20le%20escribimos%20de%20MecánicaOS`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Sin teléfono registrado</span>
                  )}

                  <Link
                    href={`/vehiculos?q=${encodeURIComponent(c.nombre)}`}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Car className="w-3.5 h-3.5 text-orange-400" />
                    Vehículos
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                Registrar Nuevo Cliente
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre Completo *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cédula / RUC</label>
                  <input
                    value={form.cedula_ruc}
                    onChange={(e) => setForm({ ...form, cedula_ruc: e.target.value })}
                    placeholder="1720000000"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Teléfono / WhatsApp</label>
                  <input
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="0991234567"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Correo Electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@empresa.com"
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Dirección</label>
                <input
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Av. Principal y Secundaria"
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
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
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
