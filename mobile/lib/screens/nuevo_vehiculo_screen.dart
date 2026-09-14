import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import 'vehiculo_detalle_screen.dart';

class NuevoVehiculoScreen extends StatefulWidget {
  final String? placaInicial;
  const NuevoVehiculoScreen({super.key, this.placaInicial});

  @override
  State<NuevoVehiculoScreen> createState() => _NuevoVehiculoScreenState();
}

class _NuevoVehiculoScreenState extends State<NuevoVehiculoScreen> {
  late final TextEditingController _placaCtrl;
  final _marcaCtrl = TextEditingController();
  final _modeloCtrl = TextEditingController();
  final _anioCtrl = TextEditingController();

  List<Cliente> _clientes = [];
  int? _clienteId;
  bool _guardando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _placaCtrl = TextEditingController(text: widget.placaInicial ?? '');
    _cargarClientes();
  }

  Future<void> _cargarClientes() async {
    try {
      final data = await apiClient.get('/api/clientes');
      setState(() => _clientes = (data as List).map((c) => Cliente.fromJson(c)).toList());
    } catch (_) {}
  }

  Future<void> _guardar() async {
    if (_clienteId == null) {
      setState(() => _error = 'Selecciona el cliente dueño del vehículo');
      return;
    }
    setState(() {
      _guardando = true;
      _error = null;
    });
    try {
      final data = await apiClient.post('/api/vehiculos', {
        'placa': _placaCtrl.text,
        'marca': _marcaCtrl.text.isEmpty ? null : _marcaCtrl.text,
        'modelo': _modeloCtrl.text.isEmpty ? null : _modeloCtrl.text,
        'anio': int.tryParse(_anioCtrl.text),
        'cliente_id': _clienteId,
      });
      final vehiculo = Vehiculo.fromJson(data);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: vehiculo.id)),
      );
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'No se pudo registrar el vehículo');
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo vehículo')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_clientes.isEmpty)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text('No hay clientes registrados. Crea uno primero.', style: TextStyle(color: Colors.orange)),
            ),
          DropdownButtonFormField<int>(
            initialValue: _clienteId,
            decoration: const InputDecoration(labelText: 'Cliente', border: OutlineInputBorder()),
            items: _clientes
                .map((c) => DropdownMenuItem(value: c.id, child: Text(c.nombre)))
                .toList(),
            onChanged: (v) => setState(() => _clienteId = v),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _placaCtrl,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'Placa', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _marcaCtrl,
            decoration: const InputDecoration(labelText: 'Marca', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _modeloCtrl,
            decoration: const InputDecoration(labelText: 'Modelo', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _anioCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Año', border: OutlineInputBorder()),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _guardando ? null : _guardar,
            child: _guardando ? const CircularProgressIndicator(strokeWidth: 2) : const Text('Guardar vehículo'),
          ),
        ],
      ),
    );
  }
}
