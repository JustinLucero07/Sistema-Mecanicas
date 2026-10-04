"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, EVENTO_SESION_EXPIRADA } from "@/lib/api";
import type { Rol } from "@/lib/types";

interface Sesion {
  usuarioId: number;
  nombre: string;
  rol: Rol;
  requiereTerminos: boolean;
}

export interface LoginResponse {
  access_token: string;
  rol: Rol;
  nombre: string;
  usuario_id: number;
  requiere_aceptar_terminos: boolean;
}

interface AuthContextValue {
  sesion: Sesion | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Guarda un token nuevo (por ejemplo, tras cambiar la contraseña). */
  aplicarLogin: (data: LoginResponse) => void;
  aceptarTerminos: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("sesion");
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage solo es posible tras montar
        setSesion(JSON.parse(raw));
      } catch {
        localStorage.removeItem("sesion");
      }
    }
    setCargando(false);
  }, []);

  const guardar = useCallback((nueva: Sesion | null) => {
    if (nueva) localStorage.setItem("sesion", JSON.stringify(nueva));
    else localStorage.removeItem("sesion");
    setSesion(nueva);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    guardar(null);
    router.push("/login");
  }, [guardar, router]);

  // Token vencido o sesión cerrada desde otro lado: se vuelve al login.
  useEffect(() => {
    const alExpirar = () => {
      if (localStorage.getItem("token")) logout();
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, [logout]);

  const aplicarLogin = useCallback(
    (data: LoginResponse) => {
      localStorage.setItem("token", data.access_token);
      guardar({ usuarioId: data.usuario_id, nombre: data.nombre, rol: data.rol, requiereTerminos: data.requiere_aceptar_terminos });
    },
    [guardar],
  );

  async function login(email: string, password: string) {
    aplicarLogin(await api.post<LoginResponse>("/api/auth/login", { email, password }));
    router.push("/dashboard");
  }

  async function aceptarTerminos() {
    await api.post("/api/auth/aceptar-terminos");
    if (sesion) guardar({ ...sesion, requiereTerminos: false });
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, login, logout, aplicarLogin, aceptarTerminos }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
