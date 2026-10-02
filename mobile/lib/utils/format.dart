import 'package:intl/intl.dart';

// Símbolo delante, igual que en la web: \$60,00.
final _moneda = NumberFormat.currency(locale: 'es_EC', symbol: '\$', customPattern: '\u00a4#,##0.00');
final _entero = NumberFormat.decimalPattern('es_EC');

String formatoMoneda(num valor) => _moneda.format(valor);

String formatoKm(int? km) => km == null ? 'Sin registro' : '${_entero.format(km)} km';

const _meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

String formatoFecha(String iso) {
  final d = DateTime.tryParse(iso)?.toLocal();
  if (d == null) return '—';
  return '${d.day} ${_meses[d.month - 1]} ${d.year}';
}

String diasEnTaller(String fechaIngreso) {
  final d = DateTime.tryParse(fechaIngreso);
  if (d == null) return '';
  final dias = DateTime.now().difference(d).inDays;
  if (dias <= 0) return 'Ingresó hoy';
  return dias == 1 ? '1 día en taller' : '$dias días en taller';
}

String etiqueta(String valor) {
  final t = valor.replaceAll('_', ' ');
  return t.isEmpty ? t : t[0].toUpperCase() + t.substring(1);
}

enum Tono { neutral, brand, ok, warn, bad, info }

/// Orden real del flujo de una orden de trabajo.
const flujoOrden = [
  'recepcion',
  'diagnostico',
  'esperando_aprobacion',
  'esperando_repuestos',
  'en_reparacion',
  'control_calidad',
  'listo_para_entregar',
  'entregado',
];

const _estados = <String, (String, Tono)>{
  'recepcion': ('Recepción', Tono.info),
  'diagnostico': ('Diagnóstico', Tono.info),
  'esperando_aprobacion': ('Esperando aprobación', Tono.warn),
  'esperando_repuestos': ('Esperando repuestos', Tono.warn),
  'en_reparacion': ('En reparación', Tono.brand),
  'control_calidad': ('Control de calidad', Tono.brand),
  'listo_para_entregar': ('Listo para entregar', Tono.ok),
  'entregado': ('Entregado', Tono.neutral),
  'cancelado': ('Cancelado', Tono.bad),
  'pendiente': ('Recepción', Tono.info),
  'en_proceso': ('En reparación', Tono.brand),
  'completado': ('Listo para entregar', Tono.ok),
};

const _equivale = {'pendiente': 'recepcion', 'en_proceso': 'en_reparacion', 'completado': 'listo_para_entregar'};

(String, Tono) estadoOrden(String estado) => _estados[estado] ?? (etiqueta(estado), Tono.neutral);

/// Siguiente estado del flujo, o null si la orden ya está cerrada.
String? siguienteEstado(String estado) {
  final i = flujoOrden.indexOf(_equivale[estado] ?? estado);
  return i >= 0 && i < flujoOrden.length - 1 ? flujoOrden[i + 1] : null;
}

const combustibleLabels = {0: 'Reserva', 25: '1/4', 50: '1/2', 75: '3/4', 100: 'Lleno'};
