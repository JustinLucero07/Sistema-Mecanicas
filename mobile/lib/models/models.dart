double _num(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

class Cliente {
  final int id;
  final String nombre;
  final String? apellidos;
  final String? cedulaRuc;
  final String? telefono;
  final String? whatsapp;
  final String? email;

  Cliente({required this.id, required this.nombre, this.apellidos, this.cedulaRuc, this.telefono, this.whatsapp, this.email});

  factory Cliente.fromJson(Map<String, dynamic> json) => Cliente(
        id: json['id'],
        nombre: json['nombre'],
        apellidos: json['apellidos'],
        cedulaRuc: json['cedula_ruc'],
        telefono: json['telefono'],
        whatsapp: json['whatsapp'],
        email: json['email'],
      );

  String get nombreCompleto => [nombre, apellidos].where((e) => e != null && e.isNotEmpty).join(' ');
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
  final int? proximoMantenimientoKm;
  final String? estado;
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
    this.proximoMantenimientoKm,
    this.estado,
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
        proximoMantenimientoKm: json['proximo_mantenimiento_km'],
        estado: json['estado'],
        cliente: json['cliente'] != null ? Cliente.fromJson(json['cliente']) : null,
      );

  String get nombre {
    final t = [marca, modelo, anio?.toString()].where((e) => e != null && e.isNotEmpty).join(' ');
    return t.isEmpty ? 'Sin marca ni modelo' : t;
  }

  bool get enTaller => estado == 'en_taller';
}

class PlacaDetectada {
  final String placaTexto;
  final double confianza;

  PlacaDetectada({required this.placaTexto, required this.confianza});

  factory PlacaDetectada.fromJson(Map<String, dynamic> json) =>
      PlacaDetectada(placaTexto: json['placa_texto'], confianza: _num(json['confianza']));
}

class DetalleOrden {
  final int id;
  final String tipo;
  final String descripcion;
  final double cantidad;
  final double subtotal;

  DetalleOrden({required this.id, required this.tipo, required this.descripcion, required this.cantidad, required this.subtotal});

  factory DetalleOrden.fromJson(Map<String, dynamic> json) => DetalleOrden(
        id: json['id'],
        tipo: json['tipo'],
        descripcion: json['descripcion'],
        cantidad: _num(json['cantidad']),
        subtotal: _num(json['subtotal']),
      );
}

class FotoOrden {
  final int id;
  final String tipo;
  final String url;

  FotoOrden({required this.id, required this.tipo, required this.url});

  factory FotoOrden.fromJson(Map<String, dynamic> json) => FotoOrden(id: json['id'], tipo: json['tipo'], url: json['url']);
}

class Checklist {
  final int nivelCombustible;
  final String? observaciones;

  Checklist({required this.nivelCombustible, this.observaciones});

  factory Checklist.fromJson(Map<String, dynamic> json) =>
      Checklist(nivelCombustible: json['nivel_combustible'] ?? 50, observaciones: json['observaciones_recepcion']);
}

class OrdenTrabajo {
  final int id;
  final int vehiculoId;
  final int? mecanicoId;
  final String? mecanicoNombre;
  final String? numeroOrden;
  final String fechaIngreso;
  final int? kilometrajeIngreso;
  final String? motivoIngreso;
  final String? diagnostico;
  final String? trabajosRealizados;
  final String estado;
  final double total;
  final List<DetalleOrden> detalles;
  final List<FotoOrden> fotos;
  final Checklist? checklist;
  final Vehiculo? vehiculo;
  final Cliente? cliente;

  OrdenTrabajo({
    required this.id,
    required this.vehiculoId,
    this.mecanicoId,
    this.mecanicoNombre,
    this.numeroOrden,
    required this.fechaIngreso,
    this.kilometrajeIngreso,
    this.motivoIngreso,
    this.diagnostico,
    this.trabajosRealizados,
    required this.estado,
    required this.total,
    required this.detalles,
    required this.fotos,
    this.checklist,
    this.vehiculo,
    this.cliente,
  });

  factory OrdenTrabajo.fromJson(Map<String, dynamic> json) => OrdenTrabajo(
        id: json['id'],
        vehiculoId: json['vehiculo_id'],
        mecanicoId: json['mecanico_id'],
        mecanicoNombre: json['mecanico']?['nombre'],
        numeroOrden: json['numero_orden'],
        fechaIngreso: json['fecha_ingreso'] ?? '',
        kilometrajeIngreso: json['kilometraje_ingreso'],
        motivoIngreso: json['motivo_ingreso'],
        diagnostico: json['diagnostico'],
        trabajosRealizados: json['trabajos_realizados'],
        estado: json['estado'] ?? '',
        total: _num(json['total']),
        detalles: (json['detalles'] as List? ?? []).map((d) => DetalleOrden.fromJson(d)).toList(),
        fotos: (json['fotos'] as List? ?? []).map((f) => FotoOrden.fromJson(f)).toList(),
        checklist: json['checklist_recepcion'] != null ? Checklist.fromJson(json['checklist_recepcion']) : null,
        vehiculo: json['vehiculo'] != null ? Vehiculo.fromJson(json['vehiculo']) : null,
        cliente: json['cliente'] != null ? Cliente.fromJson(json['cliente']) : null,
      );

  String get numero => numeroOrden ?? 'OT-$id';
  bool get cerrada => estado == 'entregado' || estado == 'cancelado';
  String get nombreCliente => (cliente ?? vehiculo?.cliente)?.nombreCompleto ?? 'Sin cliente';
}

class TimelineEvento {
  final int ordenId;
  final String? numeroOrden;
  final String fecha;
  final int? kilometraje;
  final String? motivo;
  final String? diagnostico;
  final String? trabajosRealizados;
  final List<String> repuestos;
  final String? mecanicoNombre;
  final double costoTotal;
  final String estado;

  TimelineEvento({
    required this.ordenId,
    this.numeroOrden,
    required this.fecha,
    this.kilometraje,
    this.motivo,
    this.diagnostico,
    this.trabajosRealizados,
    required this.repuestos,
    this.mecanicoNombre,
    required this.costoTotal,
    required this.estado,
  });

  factory TimelineEvento.fromJson(Map<String, dynamic> json) => TimelineEvento(
        ordenId: json['orden_id'] ?? 0,
        numeroOrden: json['numero_orden'],
        fecha: json['fecha'] ?? '',
        kilometraje: json['kilometraje'],
        motivo: json['motivo'],
        diagnostico: json['diagnostico'],
        trabajosRealizados: json['trabajos_realizados'],
        repuestos: (json['repuestos_utilizados'] as List? ?? []).map((e) => e.toString()).toList(),
        mecanicoNombre: json['mecanico_nombre'],
        costoTotal: _num(json['costo_total']),
        estado: json['estado'] ?? '',
      );
}
