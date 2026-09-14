class Cliente {
  final int id;
  final String nombre;
  final String? cedulaRuc;
  final String? telefono;
  final String? email;
  final String? direccion;

  Cliente({
    required this.id,
    required this.nombre,
    this.cedulaRuc,
    this.telefono,
    this.email,
    this.direccion,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) => Cliente(
        id: json['id'],
        nombre: json['nombre'],
        cedulaRuc: json['cedula_ruc'],
        telefono: json['telefono'],
        email: json['email'],
        direccion: json['direccion'],
      );
}

class Vehiculo {
  final int id;
  final int clienteId;
  final String placa;
  final String? marca;
  final String? modelo;
  final int? anio;
  final String? color;
  final int? kilometrajeActual;
  final Cliente? cliente;

  Vehiculo({
    required this.id,
    required this.clienteId,
    required this.placa,
    this.marca,
    this.modelo,
    this.anio,
    this.color,
    this.kilometrajeActual,
    this.cliente,
  });

  factory Vehiculo.fromJson(Map<String, dynamic> json) => Vehiculo(
        id: json['id'],
        clienteId: json['cliente_id'],
        placa: json['placa'],
        marca: json['marca'],
        modelo: json['modelo'],
        anio: json['anio'],
        color: json['color'],
        kilometrajeActual: json['kilometraje_actual'],
        cliente: json['cliente'] != null ? Cliente.fromJson(json['cliente']) : null,
      );

  String get descripcionCorta => [marca, modelo, anio?.toString()].where((e) => e != null && e.isNotEmpty).join(' ');
}

class PlacaDetectada {
  final String placaTexto;
  final double confianza;
  final Vehiculo? vehiculo;
  final String fotoUrl;

  PlacaDetectada({required this.placaTexto, required this.confianza, this.vehiculo, required this.fotoUrl});

  factory PlacaDetectada.fromJson(Map<String, dynamic> json) => PlacaDetectada(
        placaTexto: json['placa_texto'],
        confianza: (json['confianza'] as num).toDouble(),
        vehiculo: json['vehiculo'] != null ? Vehiculo.fromJson(json['vehiculo']) : null,
        fotoUrl: json['foto_url'],
      );
}

class DetalleOrden {
  final int id;
  final String tipo;
  final String descripcion;
  final double cantidad;
  final double precioUnitario;
  final double subtotal;

  DetalleOrden({
    required this.id,
    required this.tipo,
    required this.descripcion,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  factory DetalleOrden.fromJson(Map<String, dynamic> json) => DetalleOrden(
        id: json['id'],
        tipo: json['tipo'],
        descripcion: json['descripcion'],
        cantidad: (json['cantidad'] as num).toDouble(),
        precioUnitario: (json['precio_unitario'] as num).toDouble(),
        subtotal: (json['subtotal'] as num).toDouble(),
      );
}

class OrdenTrabajo {
  final int id;
  final int vehiculoId;
  final String fechaIngreso;
  final String? descripcionProblema;
  final String estado;
  final double total;
  final List<DetalleOrden> detalles;

  OrdenTrabajo({
    required this.id,
    required this.vehiculoId,
    required this.fechaIngreso,
    this.descripcionProblema,
    required this.estado,
    required this.total,
    required this.detalles,
  });

  factory OrdenTrabajo.fromJson(Map<String, dynamic> json) => OrdenTrabajo(
        id: json['id'],
        vehiculoId: json['vehiculo_id'],
        fechaIngreso: json['fecha_ingreso'],
        descripcionProblema: json['descripcion_problema'],
        estado: json['estado'],
        total: (json['total'] as num).toDouble(),
        detalles: (json['detalles'] as List).map((d) => DetalleOrden.fromJson(d)).toList(),
      );
}

class ResumenMensual {
  final int anio;
  final int mes;
  final double ingresosTotal;
  final double egresosTotal;
  final double balanceNeto;
  final double? variacionBalancePct;

  ResumenMensual({
    required this.anio,
    required this.mes,
    required this.ingresosTotal,
    required this.egresosTotal,
    required this.balanceNeto,
    this.variacionBalancePct,
  });

  factory ResumenMensual.fromJson(Map<String, dynamic> json) => ResumenMensual(
        anio: json['anio'],
        mes: json['mes'],
        ingresosTotal: (json['ingresos_total'] as num).toDouble(),
        egresosTotal: (json['egresos_total'] as num).toDouble(),
        balanceNeto: (json['balance_neto'] as num).toDouble(),
        variacionBalancePct: (json['variacion_balance_pct'] as num?)?.toDouble(),
      );
}

class PuntoTendencia {
  final int anio;
  final int mes;
  final double balanceNeto;

  PuntoTendencia({required this.anio, required this.mes, required this.balanceNeto});

  factory PuntoTendencia.fromJson(Map<String, dynamic> json) => PuntoTendencia(
        anio: json['anio'],
        mes: json['mes'],
        balanceNeto: (json['balance_neto'] as num).toDouble(),
      );
}

class DashboardFinanciero {
  final ResumenMensual resumenMesActual;
  final List<PuntoTendencia> tendencia12Meses;
  final double cuentasPorCobrarTotal;
  final double cuentasPorPagarTotal;

  DashboardFinanciero({
    required this.resumenMesActual,
    required this.tendencia12Meses,
    required this.cuentasPorCobrarTotal,
    required this.cuentasPorPagarTotal,
  });

  factory DashboardFinanciero.fromJson(Map<String, dynamic> json) => DashboardFinanciero(
        resumenMesActual: ResumenMensual.fromJson(json['resumen_mes_actual']),
        tendencia12Meses:
            (json['tendencia_12_meses'] as List).map((p) => PuntoTendencia.fromJson(p)).toList(),
        cuentasPorCobrarTotal: (json['cuentas_por_cobrar_total'] as num).toDouble(),
        cuentasPorPagarTotal: (json['cuentas_por_pagar_total'] as num).toDouble(),
      );
}
