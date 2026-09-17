"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  icon?: LucideIcon;
  subValue?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
  subValue,
}: StatCardProps) {
  const getColors = () => {
    switch (tone) {
      case "positive":
        return {
          glow: "from-emerald-500/10 to-transparent",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
          badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
          iconBg: "bg-emerald-500/15 text-emerald-400",
        };
      case "negative":
        return {
          glow: "from-rose-500/10 to-transparent",
          text: "text-rose-400",
          border: "border-rose-500/20",
          badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
          iconBg: "bg-rose-500/15 text-rose-400",
        };
      case "warning":
        return {
          glow: "from-amber-500/10 to-transparent",
          text: "text-amber-400",
          border: "border-amber-500/20",
          badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
          iconBg: "bg-amber-500/15 text-amber-400",
        };
      default:
        return {
          glow: "from-indigo-500/10 to-transparent",
          text: "text-slate-100",
          border: "border-slate-800/80",
          badge: "bg-slate-800 text-slate-300 border-slate-700/50",
          iconBg: "bg-slate-800 text-slate-300",
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-card p-5 border ${colors.border} shadow-lg transition-all group`}>
      {/* Ambient Gradient Glow in corner */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${colors.glow} blur-2xl pointer-events-none group-hover:scale-150 transition-transform`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className={`text-2xl font-bold font-mono tracking-tight ${colors.text}`}>
              {value}
            </h4>
            {subValue && (
              <span className="text-xs font-mono text-slate-500">{subValue}</span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${colors.iconBg} border border-white/5`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {hint && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-[11px] ${colors.badge}`}>
            {tone === "positive" ? (
              <TrendingUp className="w-3 h-3" />
            ) : tone === "negative" ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}
