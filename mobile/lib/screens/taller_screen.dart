import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import '../widgets.dart';
import 'escanear_placa_screen.dart';
import 'orden_detalle_screen.dart';

/// Inicio del mecánico: identificar un vehículo y ver los trabajos en curso.
class TallerScreen extends StatefulWidget {
  const TallerScreen({super.key});

  @override
  State<TallerScreen> createState() => _TallerScreenState();
}

class _TallerScreenState extends State<TallerScreen> {
  List<OrdenTrabajo>? _ordenes;
  String? _error;
  bool _soloMias = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final data = await apiClient.get('/api/ordenes') as List;
      if (!mounted) return;
      setState(() {
        _ordenes = data.map((o) => OrdenTrabajo.fromJson(o)).where((o) => !o.cerrada).toList();
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudieron cargar las órdenes.'));
    }
  }

  Future<void> _abrir(Widget pantalla) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => pantalla));
    _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final auth = context.watch<AuthService>();
    final todas = _ordenes ?? [];
    final mias = todas.where((o) => o.mecanicoId == auth.usuarioId).toList();
    final visibles = auth.esMecanico && _soloMias ? mias : todas;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _cargar,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Hola, ${auth.nombre?.split(' ').first ?? ''}', style: displayStyle(context, size: 32)),
                  ),
                  IconButton(
                    onPressed: () => context.read<AuthService>().logout(),
                    tooltip: 'Cerrar sesión',
                    icon: Icon(Icons.logout, color: c.ink3),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Material(
                color: c.brand,
                borderRadius: BorderRadius.circular(14),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => _abrir(const EscanearPlacaScreen()),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Icon(Icons.center_focus_strong, size: 38, color: c.brandInk),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Identificar vehículo', style: TextStyle(fontFamily: kDisplayFont, fontSize: 26, fontWeight: FontWeight.w600, height: 1.1, color: c.brandInk)),
                              const SizedBox(height: 2),
                              Text('Foto de la placa o escríbela', style: TextStyle(fontSize: 15, color: c.brandInk.withValues(alpha: 0.8))),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right, color: c.brandInk),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 26),
              Row(
                children: [
                  Expanded(child: Text('En el taller', style: displayStyle(context, size: 24))),
                  if (_ordenes != null)
                    Text('${visibles.length}', style: TextStyle(fontFamily: kDisplayFont, fontSize: 24, fontWeight: FontWeight.w600, color: c.ink3)),
                ],
              ),
              if (auth.esMecanico) ...[
                const SizedBox(height: 10),
                SegmentedButton<bool>(
                  showSelectedIcon: false,
                  segments: [
                    ButtonSegment(value: true, label: Text('Mis trabajos (${mias.length})')),
                    ButtonSegment(value: false, label: Text('Todo el taller (${todas.length})')),
                  ],
                  selected: {_soloMias},
                  onSelectionChanged: (s) => setState(() => _soloMias = s.first),
                ),
              ],
              const SizedBox(height: 12),
              if (_error != null)
                Aviso(_error!)
              else if (_ordenes == null)
                const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
              else if (visibles.isEmpty)
                Vacio(
                  icono: Icons.directions_car_outlined,
                  titulo: auth.esMecanico && _soloMias ? 'No tienes trabajos asignados' : 'No hay vehículos en el taller',
                  descripcion: auth.esMecanico && _soloMias && todas.isNotEmpty
                      ? 'Hay ${todas.length} en el taller sin asignarte.'
                      : 'Identifica un vehículo para abrirle una orden.',
                  accion: auth.esMecanico && _soloMias && todas.isNotEmpty
                      ? TextButton(onPressed: () => setState(() => _soloMias = false), child: const Text('Ver todo el taller'))
                      : null,
                )
              else
                for (final orden in visibles)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: OrdenTile(orden: orden, onTap: () => _abrir(OrdenDetalleScreen(ordenId: orden.id))),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
