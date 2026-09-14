"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Rol } from "@/lib/types";

interface Sesion {
  usuarioId: number;
  nombre: string;
  rol: Rol;
}

interface AuthContextValue {
  sesion: Sesion | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  access_token: string;
  rol: Rol;
  nombre: string;
  usuario_id: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("sesion");
    if (raw) {
      try {
        setSesion(JSON.parse(raw));
      } catch {
        localStorage.removeItem("sesion");
      }
    }
    setCargando(false);
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<LoginResponse>("/api/auth/login", { email, password });
    const nuevaSesion: Sesion = { usuarioId: data.usuario_id, nombre: data.nombre, rol: data.rol };
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("sesion", JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("sesion");
    setSesion(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
