export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(valor);
}

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}

export function formatoPct(valor: number | null): string {
  if (valor === null) return "—";
  const signo = valor > 0 ? "+" : "";
  return `${signo}${valor.toFixed(1)}%`;
}
