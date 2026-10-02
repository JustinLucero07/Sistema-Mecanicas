export type Rol =
  | "superadmin"
  | "admin_taller"
  | "gerente"
  | "recepcionista"
  | "mecanico"
  | "inventario"
  | "contabilidad"
  | "cliente"
  | "admin"
  | "cajero";

export interface Cliente {
  id: number;
  nombre: string;
  apellidos?: string | null;
  cedula_ruc: string | null;
  telefono: string | null;
  whatsapp?: string | null;
  email: string | null;
  ciudad?: string | null;
  direccion: string | null;
  notas?: string | null;
  nombre_completo?: string;
}

export interface FotoVehiculo {
  id: number;
  tipo: string;
  url: string;
  observacion?: string | null;
  creado_en?: string;
}

export interface DocumentoVehiculo {
  id: number;
  nombre: string;
  tipo: string;
  url: string;
  creado_en?: string;
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
  combustible?: string | null;
  cilindraje?: string | null;
  transmision?: string | null;
  kilometraje_actual: number | null;
  kilometraje_anterior?: number | null;
  proximo_mantenimiento_km?: number | null;
  estado?: string | null;
  foto_placa_url: string | null;
  notas?: string | null;
  cliente?: Cliente;
  fotos?: FotoVehiculo[];
  documentos?: DocumentoVehiculo[];
}

export interface TimelineEvento {
  orden_id: number;
  numero_orden: string | null;
  fecha: string;
  kilometraje: number | null;
  motivo: string | null;
  diagnostico: string | null;
  trabajos_realizados: string | null;
  repuestos_utilizados: string[];
  mecanico_nombre: string | null;
  costo_total: number;
  estado: string;
  fotos: string[];
  observaciones: string | null;
}

export interface PlacaDetectada {
  placa_texto: string;
  confianza: number;
  vehiculo: Vehiculo | null;
  foto_url: string;
}

export type EstadoOrden =
  | "recepcion"
  | "diagnostico"
  | "esperando_aprobacion"
  | "esperando_repuestos"
  | "en_reparacion"
  | "control_calidad"
  | "listo_para_entregar"
  | "entregado"
  | "cancelado"
  | "pendiente"
  | "en_proceso"
  | "completado";

export interface DetalleOrden {
  id: number;
  tipo: "mano_obra" | "repuesto" | "servicio_externo";
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  repuesto_id: number | null;
}

export interface Foto {
  id: number;
  tipo: string;
  url: string;
  descripcion?: string | null;
}

export interface ChecklistRecepcion {
  id: number;
  orden_id: number;
  nivel_combustible: number;
  radio: boolean;
  herramientas: boolean;
  gato_palanca: boolean;
  llanta_emergencia: boolean;
  observaciones_recepcion?: string | null;
  firma_cliente_url?: string | null;
}

export interface OrdenTrabajo {
  id: number;
  numero_orden?: string | null;
  vehiculo_id: number;
  cliente_id?: number | null;
  mecanico_id: number | null;
  mecanico?: { id: number; nombre: string } | null;
  fecha_ingreso: string;
  fecha_entrega?: string | null;
  fecha_entrega_estimada?: string | null;
  fecha_entrega_real?: string | null;
  kilometraje_ingreso: number | null;
  motivo_ingreso?: string | null;
  descripcion_problema?: string | null;
  trabajos_solicitados?: string | null;
  diagnostico: string | null;
  trabajos_realizados?: string | null;
  observaciones?: string | null;
  estado: EstadoOrden;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  subtotal?: number;
  descuento?: number;
  impuestos?: number;
  total: number;
  monto_pagado?: number;
  saldo_pendiente?: number;
  detalles: DetalleOrden[];
  fotos: Foto[];
  checklist_recepcion?: ChecklistRecepcion | null;
  vehiculo?: Vehiculo;
  cliente?: Cliente;
}

export interface Repuesto {
  id: number;
  nombre: string;
  codigo: string | null;
  sku: string | null;
  categoria: string | null;
  marca: string | null;
  stock_actual: number;
  stock_minimo: number;
  costo_compra: number;
  precio_venta: number;
  unidad: string | null;
  ubicacion?: string | null;
}

export interface Proveedor {
  id: number;
  nombre: string;
  ruc: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
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
