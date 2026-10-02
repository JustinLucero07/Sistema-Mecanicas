import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';
import 'orden_detalle_screen.dart';
import 'recepcion_sheet.dart';

/// Ficha del vehículo: datos clave e historial completo de visitas.
class VehiculoDetalleScreen extends StatefulWidget {
  final int vehiculoId;
  const VehiculoDetalleScreen({super.key, required this.vehiculoId});

  @override
  State<VehiculoDetalleScreen> createState() => _VehiculoDetalleScreenState();
}

class _VehiculoDetalleScreenState extends State<VehiculoDetalleScreen> {
  Vehiculo? _vehiculo;
  List<TimelineEvento>? _timeline;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final v = await apiClient.get('/api/vehiculos/${widget.vehiculoId}');
      final t = await apiClient.get('/api/vehiculos/${widget.vehiculoId}/timeline') as List;
      if (!mounted) return;
      setState(() {
        _vehiculo = Vehiculo.fromJson(v);
        _timeline = t.map((e) => TimelineEvento.fromJson(e)).toList();
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudo cargar el vehículo.'));
    }
  }

  Future<void> _abrirOrden(int ordenId) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrdenDetalleScreen(ordenId: ordenId)));
    _cargar();
  }

  Future<void> _nuevaOrden() async {
    final ordenId = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => RecepcionSheet(vehiculo: _vehiculo!),
    );
    if (ordenId != null && mounted) _abrirOrden(ordenId);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final v = _vehiculo;
    if (v == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? Padding(padding: const EdgeInsets.all(16), child: Aviso(_error!)) : const Center(child: CircularProgressIndicator()),
      );
    }

    final timeline = _timeline ?? [];
    final ultima = timeline.isNotEmpty ? timeline.first : null;
    final telefono = (v.cliente?.whatsapp ?? v.cliente?.telefono ?? '').replaceAll(RegExp(r'\D'), '');
    final faltan = v.proximoMantenimientoKm != null && v.kilometrajeActual != null ? v.proximoMantenimientoKm! - v.kilometrajeActual! : null;

    return Scaffold(
      appBar: AppBar(
        actions: [
          if (telefono.isNotEmpty)
            IconButton(
              tooltip: 'Escribir por WhatsApp',
              icon: const Icon(Icons.chat_outlined),
              onPressed: () => launchUrl(Uri.parse('https://wa.me/$telefono'), mode: LaunchMode.externalApplication),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: FilledButton.icon(onPressed: _nuevaOrden, icon: const Icon(Icons.add), label: const Text('Nueva orden de trabajo')),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          children: [
            Align(alignment: Alignment.centerLeft, child: PlateBadge(v.placa, scale: 1.7)),
            const SizedBox(height: 14),
            Text(v.nombre, style: displayStyle(context, size: 34)),
            const SizedBox(height: 4),
            Text(v.cliente?.nombreCompleto ?? 'Sin cliente', style: TextStyle(color: c.ink2, fontSize: 16)),
            if (v.enTaller || (faltan != null && faltan <= 1000)) ...[
              const SizedBox(height: 10),
              Wrap(spacing: 8, runSpacing: 6, children: [
                if (v.enTaller) const Etiqueta('En el taller', tono: Tono.brand),
                if (faltan != null && faltan <= 1000)
                  Etiqueta(faltan <= 0 ? 'Mantenimiento vencido' : 'Mantenimiento en ${formatoKm(faltan)}', tono: Tono.warn),
              ]),
            ],
            const SizedBox(height: 18),
            Panel(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: Dato('Kilometraje', formatoKm(v.kilometrajeActual))),
                  Expanded(child: Dato('Última visita', ultima != null ? formatoFecha(ultima.fecha) : 'Sin visitas')),
                ],
              ),
            ),
            const SizedBox(height: 26),
            Text('Historial', style: displayStyle(context, size: 24)),
            const SizedBox(height: 10),
            if (timeline.isEmpty)
              const Vacio(
                icono: Icons.history,
                titulo: 'Este vehículo aún no tiene historial',
                descripcion: 'Cada orden quedará aquí con su kilometraje, repuestos y costo.',
              )
            else
              for (final ev in timeline)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Panel(
                    onTap: () => _abrirOrden(ev.ordenId),
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text('${formatoFecha(ev.fecha)} · ${formatoKm(ev.kilometraje)}', style: TextStyle(color: c.ink3, fontSize: 14))),
                            Text(formatoMoneda(ev.costoTotal), style: const TextStyle(fontFamily: kDisplayFont, fontSize: 20, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(ev.motivo?.isNotEmpty == true ? ev.motivo! : 'Orden de trabajo', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        if (ev.diagnostico?.isNotEmpty == true) ...[
                          const SizedBox(height: 6),
                          Text(ev.diagnostico!, style: TextStyle(color: c.ink2, fontSize: 15)),
                        ],
                        if (ev.repuestos.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text('Repuestos: ${ev.repuestos.join(", ")}', style: TextStyle(color: c.ink3, fontSize: 14)),
                        ],
                        const SizedBox(height: 10),
                        Wrap(spacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
                          EtiquetaEstado(ev.estado),
                          Text(ev.mecanicoNombre ?? 'Sin mecánico', style: TextStyle(color: c.ink3, fontSize: 13)),
                        ]),
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
