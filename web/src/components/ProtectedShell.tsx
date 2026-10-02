"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  CarFront,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  ScanLine,
  Search,
  Sun,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { etiqueta } from "@/lib/format";
import type { Rol } from "@/lib/types";
import ScannerModal from "@/components/ScannerModal";
import { Button, cn } from "@/components/ui";

const ROLES_FINANZAS: Rol[] = ["superadmin", "admin_taller", "admin", "gerente", "contabilidad", "cajero"];

const NAV: { href: string; label: string; icon: LucideIcon; roles?: Rol[] }[] = [
  { href: "/dashboard", label: "Taller", icon: LayoutGrid },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList },
  { href: "/vehiculos", label: "Vehículos", icon: CarFront },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/financiero", label: "Caja y finanzas", icon: Wallet, roles: ROLES_FINANZAS },
];

export function puedeVerFinanzas(rol: Rol | undefined): boolean {
  return !!rol && ROLES_FINANZAS.includes(rol);
}

function Marca() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-brand font-display text-lg font-bold leading-none text-brand-ink">
        M
      </span>
      <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight text-ink">MecánicaOS</span>
    </Link>
  );
}

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { sesion, cargando, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!cargando && !sesion) router.replace("/login");
  }, [cargando, sesion, router]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("busqueda-global")?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (cargando || !sesion) {
    return <div className="grid min-h-screen place-items-center text-ink-3">Cargando…</div>;
  }

  const items = NAV.filter((item) => !item.roles || item.roles.includes(sesion.rol));

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    const q = busqueda.trim();
    if (q) router.push(`/vehiculos?q=${encodeURIComponent(q)}`);
  }

  const navegacion = (
    <nav className="flex flex-col gap-0.5" aria-label="Secciones">
      {items.map(({ href, label, icon: Icon }) => {
        const activo = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors",
              activo ? "bg-brand-soft text-brand-text" : "text-ink-2 hover:bg-raised hover:text-ink",
            )}
          >
            <Icon className="size-[1.15rem]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const pieUsuario = (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-raised text-[0.87rem] font-semibold text-ink-2">
        {sesion.nombre.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.93rem] font-semibold text-ink">{sesion.nombre}</p>
        <p className="truncate text-[0.8rem] text-ink-3">{etiqueta(sesion.rol)}</p>
      </div>
      <button onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión" className="rounded-lg p-2 text-ink-3 hover:bg-raised hover:text-bad">
        <LogOut className="size-[1.15rem]" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-5">
          <Marca />
        </div>
        <div className="flex-1 overflow-y-auto px-3">{navegacion}</div>
        <div className="space-y-4 border-t border-line p-4">
          <Button icon={ScanLine} className="w-full" onClick={() => setScannerOpen(true)}>
            Escanear placa
          </Button>
          {pieUsuario}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur md:px-8">
          <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú" className="rounded-lg p-2 text-ink-2 hover:bg-raised lg:hidden">
            <Menu className="size-5" />
          </button>

          <form onSubmit={onBuscar} role="search" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id="busqueda-global"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar placa, VIN o cliente"
              aria-label="Buscar placa, VIN o cliente"
              className="h-9 w-full rounded-lg border border-line bg-surface pr-14 pl-9 text-[0.93rem] placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line px-1.5 font-sans text-[0.75rem] text-ink-3 sm:block">
              Ctrl K
            </kbd>
          </form>

          <button
            onClick={toggleTheme}
            aria-label={resolvedTheme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            title={resolvedTheme === "dark" ? "Tema claro" : "Tema oscuro"}
            className="rounded-lg p-2 text-ink-2 hover:bg-raised hover:text-ink"
          >
            {resolvedTheme === "dark" ? <Sun className="size-[1.15rem]" /> : <Moon className="size-[1.15rem]" />}
          </button>
          <Button size="sm" icon={ScanLine} className="lg:hidden" onClick={() => setScannerOpen(true)}>
            Escanear
          </Button>
        </header>

        <main className="mx-auto w-full max-w-[84rem] flex-1 space-y-7 px-4 py-7 md:px-8">{children}</main>
      </div>

      {menuOpen && (
        <div className="overlay-in fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="flex h-full w-72 max-w-[85vw] flex-col bg-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <Marca />
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="rounded-lg p-2 text-ink-3 hover:bg-raised">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3">{navegacion}</div>
            <div className="border-t border-line p-4">{pieUsuario}</div>
          </div>
        </div>
      )}

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
