"use client";

import { useEffect, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { X, type LucideIcon } from "lucide-react";
import type { Tono } from "@/lib/format";

export function cn(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- Botones */

type Variante = "primary" | "secondary" | "ghost" | "danger";
type Tamano = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-raised",
  ghost: "text-ink-2 hover:bg-raised hover:text-ink",
  danger: "bg-bad-soft text-bad hover:brightness-95",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "h-8 px-3 text-[0.87rem] gap-1.5",
  md: "h-10 px-4 text-[0.93rem] gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

function claseBoton(variant: Variante, size: Tamano, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors disabled:opacity-50",
    VARIANTES[variant],
    TAMANOS[size],
    className,
  );
}

type PropsBoton = { variant?: Variante; size?: Tamano; icon?: LucideIcon };

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: PropsBoton & ComponentProps<"button">) {
  return (
    <button className={claseBoton(variant, size, className)} {...props}>
      {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: PropsBoton & ComponentProps<typeof Link>) {
  return (
    <Link className={claseBoton(variant, size, className)} {...props}>
      {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------- Superficies */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-xl border border-line bg-surface", className)}>{children}</section>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-display text-xl font-semibold leading-tight text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[0.87rem] text-ink-3">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[2.1rem] font-semibold leading-none tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-[65ch] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Etiquetas */

const TONOS: Record<Tono, string> = {
  neutral: "bg-raised text-ink-2 border-line",
  brand: "bg-brand-soft text-brand-text border-transparent",
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
  info: "bg-info-soft text-info border-transparent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tono; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.8rem] font-semibold whitespace-nowrap",
        TONOS[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Placa ecuatoriana: el elemento que identifica a cada vehículo en toda la app. */
export function Plate({ placa, size = "md" }: { placa: string; size?: "sm" | "md" | "lg" }) {
  const medidas = {
    sm: { caja: "min-w-[5.2rem] rounded-[5px] border-[1.5px]", banda: "text-[0.42rem] py-px", texto: "text-[1.05rem] px-2 pb-0.5" },
    md: { caja: "min-w-[7rem] rounded-md border-2", banda: "text-[0.5rem] py-0.5", texto: "text-[1.45rem] px-2.5 pb-0.5" },
    lg: { caja: "min-w-[11rem] rounded-lg border-[2.5px]", banda: "text-[0.65rem] py-1", texto: "text-[2.5rem] px-4 pb-1" },
  }[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 flex-col overflow-hidden border-[#1d242b] bg-white text-center text-[#11161b] shadow-[0_1px_0_rgb(0_0_0/0.25)] dark:ring-1 dark:ring-white/15",
        medidas.caja,
      )}
      aria-label={`Placa ${placa}`}
    >
      <span className={cn("bg-[#1d242b] font-semibold leading-none tracking-[0.28em] text-white", medidas.banda)} aria-hidden>
        ECUADOR
      </span>
      <span className={cn("font-display font-bold leading-none tracking-[0.06em]", medidas.texto)}>{placa}</span>
    </span>
  );
}

/* ------------------------------------------------------------- Formularios */

export const controlClass =
  "h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-[0.93rem] text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.87rem] font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.8rem] text-ink-3">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(controlClass, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "h-auto min-h-[5.5rem] py-2.5 leading-relaxed", className)} {...props} />;
}

/* ---------------------------------------------------------------- Estados */

export function Alert({ tone = "bad", children }: { tone?: "bad" | "ok" | "warn" | "info"; children: ReactNode }) {
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cn("rounded-lg px-4 py-3 text-[0.93rem] font-medium", TONOS[tone])}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-raised text-ink-3">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-[42ch] text-[0.93rem] text-ink-3">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-line/60", className)} />;
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; count?: number }[];
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const activo = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={activo}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-[0.93rem] font-semibold whitespace-nowrap transition-colors",
              activo ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("rounded px-1.5 text-[0.8rem]", activo ? "bg-brand-soft text-brand-text" : "bg-raised text-ink-3")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "dialog-in flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-card sm:rounded-2xl",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold leading-tight">{title}</h2>
            {description && <p className="mt-0.5 text-[0.87rem] text-ink-3">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="-mr-1.5 rounded-lg p-1.5 text-ink-3 hover:bg-raised hover:text-ink">
            <X className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Tabla */

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 text-left text-[0.8rem] font-semibold text-ink-3", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
