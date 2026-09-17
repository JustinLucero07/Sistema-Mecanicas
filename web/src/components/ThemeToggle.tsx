"use client";

import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 text-xs">
      <button
        onClick={() => setTheme("light")}
        title="Modo Claro"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === "light"
            ? "bg-white text-orange-500 shadow-sm font-semibold"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        title="Modo Oscuro"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === "dark"
            ? "bg-slate-800 text-orange-400 shadow-sm font-semibold"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("system")}
        title="Modo Automático del Sistema"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-semibold"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
