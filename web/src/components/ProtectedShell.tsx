"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehiculos", label: "Vehículos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/financiero", label: "Financiero" },
];

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { sesion, cargando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!cargando && !sesion) {
      router.replace("/login");
    }
  }, [cargando, sesion, router]);

  if (cargando || !sesion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-slate-900 text-white md:h-screen md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-4 text-lg font-semibold">Taller Mecánica</div>
        <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-2 md:flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                pathname?.startsWith(item.href)
                  ? "bg-slate-700 font-medium"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-4 py-3 text-sm text-slate-300">
          <div className="truncate">{sesion.nombre}</div>
          <div className="text-xs uppercase text-slate-500">{sesion.rol}</div>
          <button onClick={logout} className="mt-2 text-xs text-red-400 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">{children}</main>
    </div>
  );
}
