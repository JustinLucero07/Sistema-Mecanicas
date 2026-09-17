import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../utils/format.dart';

class VehiculoDetalleScreen extends StatefulWidget {
  final int vehiculoId;
  const VehiculoDetalleScreen({super.key, required this.vehiculoId});

  @override
  State<VehiculoDetalleScreen> createState() => _VehiculoDetalleScreenState();
}

class _VehiculoDetalleScreenState extends State<VehiculoDetalleScreen> {
  Vehiculo? _vehiculo;
  List<TimelineEvento> _timeline = [];
  String? _error;
  bool _cargando = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _cargando = true);
    try {
      final v = await apiClient.get('/api/vehiculos/${widget.vehiculoId}');
      final timelineData = await apiClient.get('/api/vehiculos/${widget.vehiculoId}/timeline').catchError((_) => []);
      if (!mounted) return;
      setState(() {
        _vehiculo = Vehiculo.fromJson(v);
        if (timelineData is List) {
          _timeline = timelineData.map((e) => TimelineEvento.fromJson(e)).toList();
        }
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e is ApiException ? e.message : 'Error al cargar datos del vehículo');
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _agregarOrden() async {
    final resultado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _NuevaOrdenSheet(vehiculo: _vehiculo!),
    );
    if (resultado == true) _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!))),
      );
    }

    if (_vehiculo == null || _cargando) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFF97316))));
    }

    final v = _vehiculo!;

    return Scaffold(
      appBar: AppBar(
        title: Text(v.placa),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _cargar,
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton.icon(
            onPressed: _agregarOrden,
            icon: const Icon(Icons.flash_on_rounded),
            label: const Text('Crear Nueva Orden de Trabajo'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 4,
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        color: const Color(0xFFF97316),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Cockpit Card: Placa Metálica y Ficha Técnica
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Chapa Metálica de Placa
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFFFFFF), Color(0xFFE2E8F0)],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF334155), width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            v.placa,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),

                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: v.estado == 'en_taller'
                                ? Colors.orange.withValues(alpha: 0.15)
                                : Colors.green.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            v.estado == 'en_taller' ? 'EN TALLER' : 'ACTIVO',
                            style: TextStyle(
                              color: v.estado == 'en_taller' ? Colors.orange : Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      v.descripcionCorta.isEmpty ? 'Vehículo sin marca/modelo' : v.descripcionCorta,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Propietario: ${v.cliente?.nombre ?? "Sin asignar"}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? Colors.white70 : const Color(0xFF475569),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (v.kilometrajeActual != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.speed_rounded, size: 16, color: Color(0xFFF97316)),
                          const SizedBox(width: 4),
                          Text(
                            'Odómetro: ${v.kilometrajeActual} km',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Encabezado Historial Clínico
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Historial Clínico Automotriz',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                Text(
                  '${_timeline.length} intervenciones',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (_timeline.isEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(Icons.history_rounded, size: 40, color: Colors.grey.withValues(alpha: 0.5)),
                      const SizedBox(height: 8),
                      const Text(
                        'Sin intervenciones registradas',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Crea una nueva orden de trabajo con el botón inferior.',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              ..._timeline.map((evento) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              evento.numeroOrden != null ? 'OT #${evento.numeroOrden}' : 'Orden #${evento.ordenId}',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                            ),
                            Text(
                              formatoMoneda(evento.costoTotal),
                              style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 14),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          evento.fecha.length >= 10 ? evento.fecha.substring(0, 10) : evento.fecha,
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        if (evento.motivo != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Motivo: ${evento.motivo}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                        if (evento.diagnostico != null) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.amber.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Diagnóstico: ${evento.diagnostico}',
                              style: const TextStyle(fontSize: 11, color: Colors.amber),
                            ),
                          ),
                        ],
                        if (evento.repuestosUtilizados.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: evento.repuestosUtilizados.map((rep) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.blueGrey.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '🔧 $rep',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}

class _NuevaOrdenSheet extends StatefulWidget {
  final Vehiculo vehiculo;
  const _NuevaOrdenSheet({required this.vehiculo});

  @override
  State<_NuevaOrdenSheet> createState() => _NuevaOrdenSheetState();
}

class _NuevaOrdenSheetState extends State<_NuevaOrdenSheet> {
  final _motivoCtrl = TextEditingController();
  final _kmCtrl = TextEditingController();
  double _combustible = 50;
  bool _guardando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.vehiculo.kilometrajeActual != null) {
      _kmCtrl.text = widget.vehiculo.kilometrajeActual.toString();
    }
  }

  Future<void> _guardar() async {
    if (_motivoCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Ingresa el motivo de ingreso');
      return;
    }

    setState(() {
      _guardando = true;
      _error = null;
    });

    try {
      await apiClient.post('/api/ordenes', {
        'vehiculo_id': widget.vehiculo.id,
        'motivo_ingreso': _motivoCtrl.text.trim(),
        'kilometraje_ingreso': int.tryParse(_kmCtrl.text),
        'checklist': {
          'nivel_combustible': _combustible.toInt(),
          'radio': true,
          'herramientas': true,
          'gato_palanca': true,
          'llanta_emergencia': true,
        },
        'detalles': [
          {
            'tipo': 'mano_obra',
            'descripcion': 'Revisión y diagnóstico inicial',
            'cantidad': 1,
            'precio_unitario': 20.0,
          }
        ],
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Error al registrar orden');
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131B2E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Nueva Orden: ${widget.vehiculo.placa}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _motivoCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Motivo de Ingreso / Falla Reportada *',
              hintText: 'Ej: Fuga de refrigerante, vibración al frenar...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _kmCtrl,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Kilometraje de Entrada (km)',
              prefixIcon: const Icon(Icons.speed_rounded),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Nivel de Gasolina:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              Text('${_combustible.toInt()}%', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFF97316))),
            ],
          ),
          Slider(
            value: _combustible,
            min: 0,
            max: 100,
            divisions: 20,
            activeColor: const Color(0xFFF97316),
            onChanged: (val) => setState(() => _combustible = val),
          ),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _guardando ? null : _guardar,
            child: _guardando
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Registrar Entrada al Taller'),
          ),
        ],
      ),
    );
  }
}
