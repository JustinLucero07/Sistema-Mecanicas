export type Rol = "admin" | "mecanico" | "cajero" | "cliente";

export interface Cliente {
  id: number;
  nombre: string;
  cedula_ruc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

export interface Vehiculo {
  id: number;
  cliente_id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
  vin_chasis: string | null;
  tipo: string | null;
  kilometraje_actual: number | null;
  foto_placa_url: string | null;
  cliente?: Cliente;
}

export interface PlacaDetectada {
  placa_texto: string;
  confianza: number;
  vehiculo: Vehiculo | null;
  foto_url: string;
}

export type EstadoOrden = "pendiente" | "en_proceso" | "completado" | "entregado" | "cancelado";

export interface DetalleOrden {
  id: number;
  tipo: "mano_obra" | "repuesto";
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  repuesto_id: number | null;
}

export interface Foto {
  id: number;
  tipo: "placa" | "antes" | "despues" | "comprobante";
  url: string;
}

export interface OrdenTrabajo {
  id: number;
  vehiculo_id: number;
  mecanico_id: number | null;
  fecha_ingreso: string;
  fecha_entrega: string | null;
  kilometraje_ingreso: number | null;
  descripcion_problema: string | null;
  diagnostico: string | null;
  estado: EstadoOrden;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  detalles: DetalleOrden[];
  fotos: Foto[];
  total: number;
}

export interface ResumenMensual {
  anio: number;
  mes: number;
  ingresos_total: number;
  egresos_total: number;
  balance_neto: number;
  variacion_ingresos_pct: number | null;
  variacion_egresos_pct: number | null;
  variacion_balance_pct: number | null;
}

export interface PuntoTendencia {
  anio: number;
  mes: number;
  ingresos_total: number;
  egresos_total: number;
  balance_neto: number;
}

export interface EgresoPorCategoria {
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface RepuestoBajoStock {
  repuesto_id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface DashboardFinanciero {
  resumen_mes_actual: ResumenMensual;
  tendencia_12_meses: PuntoTendencia[];
  egresos_por_categoria: EgresoPorCategoria[];
  cuentas_por_cobrar_total: number;
  cuentas_por_pagar_total: number;
  repuestos_bajo_stock: RepuestoBajoStock[];
}
