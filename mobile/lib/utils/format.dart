import 'package:intl/intl.dart';

final _moneda = NumberFormat.currency(locale: 'es_EC', symbol: '\$');

String formatoMoneda(num valor) => _moneda.format(valor);

const _meses = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

String nombreMes(int mes) => _meses[(mes - 1).clamp(0, 11)];
