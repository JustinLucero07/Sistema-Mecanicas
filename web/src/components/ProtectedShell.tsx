"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  Users,
  Wallet,
  Package,
  Camera,
  LogOut,
  Search,
  Bell,
  Wrench,
  ChevronDown,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ScannerModal from "@/components/ScannerModal";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehiculos", label: "Vehículos & Historial", icon: Car },
  { href: "/clientes", label: "Clientes CRM", icon: Users },
  { href: "/inventario", label: "Repuestos & Kardex", icon: Package },
  { href: "/financiero", label: "Finanzas & Caja", icon: Wallet },
];

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { sesion, cargando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [busquedaRapida, setBusquedaRapida] = useState("");

  useEffect(() => {
    if (!cargando && !sesion) {
      router.replace("/login");
    }
  }, [cargando, sesion, router]);

  // Atajo de teclado global Ctrl+K para buscar placa
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("quick-plate-search");
        if (searchInput) searchInput.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleBusqueda(e: React.FormEvent) {
    e.preventDefault();
    if (busquedaRapida.trim()) {
      router.push(`/vehiculos?q=${encodeURIComponent(busquedaRapida.trim())}`);
    }
  }

  if (cargando || !sesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Wrench className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-xs font-mono tracking-wider text-slate-500">CARGANDO MECÁNICAOS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 flex-col justify-between shrink-0 glass-panel border-r border-slate-200 dark:border-slate-800/80 z-20">
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800/80">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  MecánicaOS
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    PRO
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gestión Integral Automotriz</p>
              </div>
            </Link>

            {/* Tenant Badge */}
            <div className="mt-4 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Building2 className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
                <div className="truncate">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Taller Central</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Matriz Norte</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Módulos Principales
            </div>
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? "bg-orange-500/10 dark:bg-gradient-to-r dark:from-orange-500/15 dark:to-transparent text-orange-600 dark:text-orange-400 border-l-2 border-orange-500 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? "text-orange-600 dark:text-orange-400" : "text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Scanner Action in Sidebar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-98 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Escanear Placa (LPR)
            </button>
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                {sesion.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{sesion.nombre}</p>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {sesion.rol}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Glass */}
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-sm text-slate-900 dark:text-white">MecánicaOS</span>
          </div>

          {/* Global Quick Plate Search */}
          <form onSubmit={handleBusqueda} className="hidden sm:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              id="quick-plate-search"
              type="text"
              value={busquedaRapida}
              onChange={(e) => setBusquedaRapida(e.target.value)}
              placeholder="Buscar por placa, VIN o cliente... (Ctrl + K)"
              className="w-full rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-9 pr-14 py-2 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 shadow-xs"
            />
            <kbd className="absolute right-2.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ↵
            </kbd>
          </form>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Mode Toggle */}
            <ThemeToggle />

            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escanear Placa</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <button
              title="Notificaciones de taller"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 glass-panel border-b border-slate-800 space-y-2 animate-in slide-in-from-top duration-200">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  pathname?.startsWith(item.href)
                    ? "bg-orange-500/20 text-orange-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>

      {/* Global Plate Scanner Modal */}
      <ScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
