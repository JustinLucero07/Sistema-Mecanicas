import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import 'escanear_placa_screen.dart';
import 'nuevo_vehiculo_screen.dart';
import 'vehiculo_detalle_screen.dart';

class VehiculosScreen extends StatefulWidget {
  const VehiculosScreen({super.key});

  @override
  State<VehiculosScreen> createState() => _VehiculosScreenState();
}

class _VehiculosScreenState extends State<VehiculosScreen> {
  List<Vehiculo> _vehiculos = [];
  String? _error;
  final _buscarCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar([String? q]) async {
    try {
      final path = q != null && q.isNotEmpty ? '/api/vehiculos?q=$q' : '/api/vehiculos';
      final data = await apiClient.get(path);
      setState(() => _vehiculos = (data as List).map((v) => Vehiculo.fromJson(v)).toList());
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Error al cargar vehículos');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehículos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt),
            tooltip: 'Nuevo vehículo',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NuevoVehiculoScreen()),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const EscanearPlacaScreen()),
        ),
        icon: const Icon(Icons.camera_alt),
        label: const Text('Escanear placa'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _buscarCtrl,
              decoration: InputDecoration(
                hintText: 'Buscar por placa...',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: () => _cargar(_buscarCtrl.text),
                ),
              ),
              onSubmitted: _cargar,
            ),
          ),
          if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
          Expanded(
            child: _vehiculos.isEmpty
                ? const Center(child: Text('No hay vehículos registrados todavía.'))
                : ListView.separated(
                    itemCount: _vehiculos.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final v = _vehiculos[i];
                      return ListTile(
                        title: Text(v.placa, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(v.descripcionCorta.isEmpty ? (v.cliente?.nombre ?? '') : v.descripcionCorta),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context)
                            .push(MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: v.id)))
                            .then((_) => _cargar()),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
