"use client";

import { Fuel } from "lucide-react";

interface FuelGaugeProps {
  level: number; // 0 to 100
  onChange?: (val: number) => void;
  interactive?: boolean;
}

export default function FuelGauge({ level, onChange, interactive = false }: FuelGaugeProps) {
  const getColor = (val: number) => {
    if (val <= 20) return "from-red-500 to-red-600";
    if (val <= 45) return "from-amber-500 to-amber-600";
    return "from-emerald-500 to-teal-500";
  };

  const getTextColor = (val: number) => {
    if (val <= 20) return "text-red-400";
    if (val <= 45) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-400">
          <Fuel className="w-3.5 h-3.5 text-slate-400" />
          Nivel de Combustible
        </span>
        <span className={`font-mono font-bold ${getTextColor(level)}`}>
          {level}%
        </span>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/40">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${getColor(level)}`}
          style={{ width: `${Math.max(4, Math.min(100, level))}%` }}
        />
      </div>

      {interactive ? (
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={level}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
            <span>E (Vacío)</span>
            <span>1/4</span>
            <span>1/2</span>
            <span>3/4</span>
            <span>F (Lleno)</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span>E</span>
          <span>1/2</span>
          <span>F</span>
        </div>
      )}
    </div>
  );
}
