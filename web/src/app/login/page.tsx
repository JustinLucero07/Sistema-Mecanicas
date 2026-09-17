"use client";

import { useState } from "react";
import { Wrench, Lock, Mail, ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Credenciales inválidas o error de conexión");
    } finally {
      setCargando(false);
    }
  }

  function autollenarDemo(correo: string, pass: string) {
    setEmail(correo);
    setPassword(pass);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      {/* Luces de Fondo Ambientales */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Cabecera / Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/25 mb-2">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            MecánicaOS
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              PRO SAAS
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Plataforma Integral de Gestión para Talleres Mecánicos e Historial Clínico Automotriz
          </p>
        </div>

        {/* Tarjeta Glass del Formulario */}
        <div className="rounded-3xl glass-panel border border-slate-800/80 p-8 shadow-2xl space-y-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taller.com"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {cargando ? (
                "Verificando credenciales..."
              ) : (
                <>
                  Ingresar a MecánicaOS <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Cuentas de demostración (Seed):
              </span>
              <span className="font-mono text-slate-500 text-[10px]">Cuentas activas</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => autollenarDemo("admin@taller.com", "admin123")}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold transition-colors text-center cursor-pointer"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => autollenarDemo("carlos@taller.com", "mecanico123")}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold transition-colors text-center cursor-pointer"
              >
                🔧 Mecánico
              </button>
              <button
                type="button"
                onClick={() => autollenarDemo("caja@taller.com", "caja123")}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold transition-colors text-center cursor-pointer"
              >
                💰 Caja
              </button>
            </div>
          </div>
        </div>

        {/* Footer Seguridad */}
        <div className="text-center flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Aislamiento multi-tenant y auditoría criptográfica activa</span>
        </div>
      </div>
    </div>
  );
}
