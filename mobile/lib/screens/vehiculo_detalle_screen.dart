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
  List<OrdenTrabajo> _ordenes = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final v = await apiClient.get('/api/vehiculos/${widget.vehiculoId}');
      final ordenes = await apiClient.get('/api/ordenes?vehiculo_id=${widget.vehiculoId}');
      if (!mounted) return;
      setState(() {
        _vehiculo = Vehiculo.fromJson(v);
        _ordenes = (ordenes as List).map((o) => OrdenTrabajo.fromJson(o)).toList();
      });
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Error al cargar el vehículo');
    }
  }

  Future<void> _agregarOrden() async {
    final resultado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _NuevaOrdenSheet(vehiculoId: widget.vehiculoId),
    );
    if (resultado == true) _cargar();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return Scaffold(body: Center(child: Text(_error!)));
    if (_vehiculo == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final v = _vehiculo!;
    return Scaffold(
      appBar: AppBar(title: Text(v.placa)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _agregarOrden,
        icon: const Icon(Icons.add),
        label: const Text('Nueva entrada'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.descripcionCorta.isEmpty ? 'Sin datos de marca/modelo' : v.descripcionCorta,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text('Dueño: ${v.cliente?.nombre ?? "—"}'),
                  if (v.cliente?.telefono != null) Text('Tel: ${v.cliente!.telefono}'),
                  if (v.kilometrajeActual != null) Text('Kilometraje: ${v.kilometrajeActual} km'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Historial de mantenimiento', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_ordenes.isEmpty) const Text('Sin órdenes registradas todavía.'),
          ..._ordenes.map((o) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(o.fechaIngreso.substring(0, 10), style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text(formatoMoneda(o.total), style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      if (o.descripcionProblema != null) Text(o.descripcionProblema!),
                      ...o.detalles.map((d) => Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(child: Text('${d.descripcion} (${d.cantidad.toStringAsFixed(0)}x)')),
                                Text(formatoMoneda(d.subtotal)),
                              ],
                            ),
                          )),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }
}

class _NuevaOrdenSheet extends StatefulWidget {
  final int vehiculoId;
  const _NuevaOrdenSheet({required this.vehiculoId});

  @override
  State<_NuevaOrdenSheet> createState() => _NuevaOrdenSheetState();
}

class _NuevaOrdenSheetState extends State<_NuevaOrdenSheet> {
  final _descripcionCtrl = TextEditingController();
  final _detalleDescCtrl = TextEditingController();
  final _detallePrecioCtrl = TextEditingController();
  bool _guardando = false;
  String? _error;

  Future<void> _guardar() async {
    setState(() {
      _guardando = true;
      _error = null;
    });
    try {
      await apiClient.post('/api/ordenes', {
        'vehiculo_id': widget.vehiculoId,
        'fecha_ingreso': DateTime.now().toIso8601String(),
        'descripcion_problema': _descripcionCtrl.text.isEmpty ? null : _descripcionCtrl.text,
        'detalles': _detalleDescCtrl.text.isEmpty
            ? []
            : [
                {
                  'tipo': 'mano_obra',
                  'descripcion': _detalleDescCtrl.text,
                  'cantidad': 1,
                  'precio_unitario': double.tryParse(_detallePrecioCtrl.text) ?? 0,
                }
              ],
      });
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'No se pudo guardar la orden');
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Nueva entrada de mantenimiento', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _descripcionCtrl,
            decoration: const InputDecoration(labelText: 'Descripción del problema', border: OutlineInputBorder()),
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _detalleDescCtrl,
            decoration: const InputDecoration(labelText: 'Trabajo realizado', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _detallePrecioCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Costo', border: OutlineInputBorder()),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _guardando ? null : _guardar,
            child: _guardando ? const CircularProgressIndicator(strokeWidth: 2) : const Text('Guardar'),
          ),
        ],
      ),
    );
  }
}
