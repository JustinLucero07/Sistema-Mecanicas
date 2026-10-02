import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';
import 'nuevo_vehiculo_screen.dart';
import 'vehiculo_detalle_screen.dart';

class VehiculosScreen extends StatefulWidget {
  const VehiculosScreen({super.key});

  @override
  State<VehiculosScreen> createState() => _VehiculosScreenState();
}

class _VehiculosScreenState extends State<VehiculosScreen> {
  final _buscarCtrl = TextEditingController();
  List<Vehiculo>? _vehiculos;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  @override
  void dispose() {
    _buscarCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargar() async {
    final q = _buscarCtrl.text.trim();
    try {
      final data = await apiClient.get(q.isEmpty ? '/api/vehiculos' : '/api/vehiculos?q=${Uri.encodeQueryComponent(q)}') as List;
      if (!mounted) return;
      setState(() {
        _vehiculos = data.map((v) => Vehiculo.fromJson(v)).toList();
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudieron cargar los vehículos.'));
    }
  }

  Future<void> _abrir(Widget pantalla) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => pantalla));
    _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final lista = _vehiculos ?? [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehículos'),
        actions: [
          TextButton.icon(
            onPressed: () => _abrir(const NuevoVehiculoScreen()),
            icon: const Icon(Icons.add),
            label: const Text('Registrar'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: TextField(
              controller: _buscarCtrl,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _cargar(),
              decoration: InputDecoration(
                hintText: 'Placa, marca o cliente',
                prefixIcon: Icon(Icons.search, color: c.ink3),
                suffixIcon: _buscarCtrl.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Borrar búsqueda',
                        onPressed: () {
                          _buscarCtrl.clear();
                          _cargar();
                        },
                      ),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: _error != null
                ? Padding(padding: const EdgeInsets.all(16), child: Aviso(_error!))
                : _vehiculos == null
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: _cargar,
                        child: lista.isEmpty
                            ? ListView(
                                children: [
                                  Vacio(
                                    icono: Icons.directions_car_outlined,
                                    titulo: _buscarCtrl.text.isEmpty ? 'Aún no hay vehículos' : 'Nada coincide con “${_buscarCtrl.text}”',
                                    descripcion: 'Regístralo si es su primera visita al taller.',
                                    accion: FilledButton(
                                      onPressed: () => _abrir(NuevoVehiculoScreen(placaInicial: _buscarCtrl.text.trim().toUpperCase())),
                                      child: const Text('Registrar vehículo'),
                                    ),
                                  ),
                                ],
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                                itemCount: lista.length,
                                separatorBuilder: (_, _) => const SizedBox(height: 10),
                                itemBuilder: (context, i) {
                                  final v = lista[i];
                                  return Panel(
                                    onTap: () => _abrir(VehiculoDetalleScreen(vehiculoId: v.id)),
                                    padding: const EdgeInsets.all(14),
                                    child: Row(
                                      children: [
                                        PlateBadge(v.placa, scale: 0.8),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(v.nombre, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                              Text(
                                                '${v.cliente?.nombreCompleto ?? "Sin cliente"} · ${formatoKm(v.kilometrajeActual)}',
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: TextStyle(color: c.ink3, fontSize: 14),
                                              ),
                                              if (v.enTaller) ...[const SizedBox(height: 6), const Etiqueta('En el taller', tono: Tono.brand)],
                                            ],
                                          ),
                                        ),
                                        Icon(Icons.chevron_right, color: c.ink3),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }
}
