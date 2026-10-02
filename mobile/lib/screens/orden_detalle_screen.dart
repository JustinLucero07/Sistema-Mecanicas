import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';
import 'vehiculo_detalle_screen.dart';

/// Orden de trabajo para el mecánico: avanzar el estado, anotar diagnóstico
/// y trabajo, y dejar evidencia en fotos.
class OrdenDetalleScreen extends StatefulWidget {
  final int ordenId;
  const OrdenDetalleScreen({super.key, required this.ordenId});

  @override
  State<OrdenDetalleScreen> createState() => _OrdenDetalleScreenState();
}

class _OrdenDetalleScreenState extends State<OrdenDetalleScreen> {
  final _diagnosticoCtrl = TextEditingController();
  final _trabajoCtrl = TextEditingController();
  OrdenTrabajo? _orden;
  String? _error;
  bool _ocupado = false;

  @override
  void initState() {
    super.initState();
    _ejecutar(() => apiClient.get('/api/ordenes/${widget.ordenId}'), cargaInicial: true);
  }

  @override
  void dispose() {
    _diagnosticoCtrl.dispose();
    _trabajoCtrl.dispose();
    super.dispose();
  }

  /// Corre una acción que devuelve la orden actualizada y refresca la pantalla.
  Future<void> _ejecutar(Future<dynamic> Function() accion, {String? listo, bool cargaInicial = false}) async {
    setState(() {
      _ocupado = true;
      _error = null;
    });
    try {
      final orden = OrdenTrabajo.fromJson(await accion());
      if (!mounted) return;
      setState(() {
        _orden = orden;
        if (cargaInicial) {
          _diagnosticoCtrl.text = orden.diagnostico ?? '';
          _trabajoCtrl.text = orden.trabajosRealizados ?? '';
        }
      });
      if (listo != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(listo)));
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudo guardar el cambio.'));
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _patch(Map<String, dynamic> cambios, String listo) =>
      _ejecutar(() => apiClient.patch('/api/ordenes/${widget.ordenId}', cambios), listo: listo);

  Future<void> _agregarFoto(String tipo) async {
    final foto = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1600);
    if (foto == null) return;
    final bytes = await foto.readAsBytes();
    await _ejecutar(
      () => apiClient.postFoto('/api/ordenes/${widget.ordenId}/fotos', bytes, campos: {'tipo': tipo}),
      listo: 'Foto guardada.',
    );
  }

  Future<void> _agregarTrabajo() async {
    final descCtrl = TextEditingController();
    final precioCtrl = TextEditingController();
    final linea = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 18, 16, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Agregar mano de obra', style: displayStyle(ctx, size: 26)),
            const SizedBox(height: 14),
            TextField(controller: descCtrl, autofocus: true, textCapitalization: TextCapitalization.sentences, decoration: const InputDecoration(labelText: 'Trabajo realizado')),
            const SizedBox(height: 12),
            TextField(controller: precioCtrl, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Precio', prefixText: '\$ ')),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: () {
                final precio = double.tryParse(precioCtrl.text.replaceAll(',', '.'));
                if (descCtrl.text.trim().isEmpty || precio == null) return;
                Navigator.pop(ctx, {'tipo': 'mano_obra', 'descripcion': descCtrl.text.trim(), 'cantidad': 1, 'precio_unitario': precio});
              },
              child: const Text('Agregar'),
            ),
          ],
        ),
      ),
    );
    if (linea != null) {
      await _ejecutar(() => apiClient.post('/api/ordenes/${widget.ordenId}/detalles', linea), listo: 'Trabajo agregado.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final orden = _orden;
    if (orden == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? Padding(padding: const EdgeInsets.all(16), child: Aviso(_error!)) : const Center(child: CircularProgressIndicator()),
      );
    }

    final auth = context.watch<AuthService>();
    final siguiente = orden.cerrada ? null : siguienteEstado(orden.estado);
    final puedeTomar = auth.esMecanico && orden.mecanicoId == null && !orden.cerrada;

    Widget seccion(String t) => Padding(
          padding: const EdgeInsets.only(top: 26, bottom: 10),
          child: Text(t, style: displayStyle(context, size: 24)),
        );

    return Scaffold(
      appBar: AppBar(title: Text(orden.numero)),
      bottomNavigationBar: siguiente == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: FilledButton(
                  onPressed: _ocupado ? null : () => _patch({'estado': siguiente}, 'La orden pasó a “${estadoOrden(siguiente).$1}”.'),
                  child: Text('Pasar a ${estadoOrden(siguiente).$1.toLowerCase()}'),
                ),
              ),
            ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          Panel(
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: orden.vehiculoId))),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                PlateBadge(orden.vehiculo?.placa ?? '—'),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(orden.vehiculo?.nombre ?? 'Vehículo', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                      Text(orden.nombreCliente, style: TextStyle(color: c.ink3, fontSize: 14)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: c.ink3),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
            EtiquetaEstado(orden.estado),
            Text('${orden.mecanicoNombre ?? "Sin mecánico"} · ${diasEnTaller(orden.fechaIngreso)}', style: TextStyle(color: c.ink3, fontSize: 14)),
          ]),
          if (puedeTomar) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _ocupado ? null : () => _patch({'mecanico_id': auth.usuarioId}, 'La orden quedó a tu nombre.'),
              child: const Text('Tomar este trabajo'),
            ),
          ],
          if (_error != null) ...[const SizedBox(height: 12), Aviso(_error!)],

          seccion('Recepción'),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(orden.motivoIngreso?.isNotEmpty == true ? orden.motivoIngreso! : 'Sin motivo registrado', style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(child: Dato('Kilometraje', formatoKm(orden.kilometrajeIngreso))),
                  if (orden.checklist != null)
                    Expanded(child: Dato('Combustible', combustibleLabels[orden.checklist!.nivelCombustible] ?? '${orden.checklist!.nivelCombustible}%')),
                ]),
                if (orden.checklist?.observaciones?.isNotEmpty == true) ...[
                  const SizedBox(height: 14),
                  Dato('Daños al ingresar', orden.checklist!.observaciones!),
                ],
              ],
            ),
          ),

          seccion('Diagnóstico y trabajo'),
          TextField(
            controller: _diagnosticoCtrl,
            enabled: !orden.cerrada,
            minLines: 2,
            maxLines: 6,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'Diagnóstico', alignLabelWithHint: true),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _trabajoCtrl,
            enabled: !orden.cerrada,
            minLines: 2,
            maxLines: 6,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'Trabajo realizado', alignLabelWithHint: true),
          ),
          if (!orden.cerrada) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _ocupado
                  ? null
                  : () => _patch({'diagnostico': _diagnosticoCtrl.text.trim(), 'trabajos_realizados': _trabajoCtrl.text.trim()}, 'Guardado en el historial.'),
              child: const Text('Guardar diagnóstico y trabajo'),
            ),
          ],

          seccion('Fotos'),
          if (orden.fotos.isNotEmpty)
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              children: [
                for (final f in orden.fotos)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      f.url,
                      fit: BoxFit.cover,
                      semanticLabel: 'Foto ${etiqueta(f.tipo)}',
                      errorBuilder: (_, _, _) => ColoredBox(color: c.raised, child: Icon(Icons.broken_image_outlined, color: c.ink3)),
                    ),
                  ),
              ],
            )
          else
            Text('Sin fotos todavía. Sirven de evidencia de cómo llegó y cómo salió.', style: TextStyle(color: c.ink3, fontSize: 15)),
          if (!orden.cerrada) ...[
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: OutlinedButton.icon(onPressed: _ocupado ? null : () => _agregarFoto('antes'), icon: const Icon(Icons.photo_camera_outlined), label: const Text('Foto antes'))),
              const SizedBox(width: 10),
              Expanded(child: OutlinedButton.icon(onPressed: _ocupado ? null : () => _agregarFoto('despues'), icon: const Icon(Icons.photo_camera_outlined), label: const Text('Foto después'))),
            ]),
          ],

          seccion('Trabajos y repuestos'),
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (final d in orden.detalles) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(d.descripcion, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          Text('${d.tipo == 'repuesto' ? 'Repuesto' : 'Mano de obra'} · cantidad ${d.cantidad.toStringAsFixed(d.cantidad % 1 == 0 ? 0 : 2)}', style: TextStyle(color: c.ink3, fontSize: 14)),
                        ]),
                      ),
                      Text(formatoMoneda(d.subtotal), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                  const Divider(),
                ],
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(children: [
                    const Expanded(child: Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                    Text(formatoMoneda(orden.total), style: const TextStyle(fontFamily: kDisplayFont, fontSize: 26, fontWeight: FontWeight.w600)),
                  ]),
                ),
              ],
            ),
          ),
          if (!orden.cerrada) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(onPressed: _ocupado ? null : _agregarTrabajo, icon: const Icon(Icons.add), label: const Text('Agregar mano de obra')),
          ],
        ],
      ),
    );
  }
}
