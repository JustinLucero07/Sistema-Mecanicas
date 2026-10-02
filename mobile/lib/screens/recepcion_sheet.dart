import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';

/// Recepción rápida: pocos toques para abrir la orden. Devuelve el id creado.
class RecepcionSheet extends StatefulWidget {
  final Vehiculo vehiculo;
  const RecepcionSheet({super.key, required this.vehiculo});

  @override
  State<RecepcionSheet> createState() => _RecepcionSheetState();
}

class _RecepcionSheetState extends State<RecepcionSheet> {
  static const _atajos = ['Mantenimiento', 'Reparación', 'Diagnóstico', 'Inspección'];
  static const _accesorios = {
    'radio': 'Radio',
    'herramientas': 'Herramientas',
    'gato_palanca': 'Gato y palanca',
    'llanta_emergencia': 'Llanta de emergencia',
  };

  final _motivoCtrl = TextEditingController();
  final _danosCtrl = TextEditingController();
  late final TextEditingController _kmCtrl;
  int _combustible = 50;
  final Map<String, bool> _tiene = {for (final k in _accesorios.keys) k: true};
  bool _guardando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _kmCtrl = TextEditingController(text: widget.vehiculo.kilometrajeActual?.toString() ?? '');
  }

  @override
  void dispose() {
    _motivoCtrl.dispose();
    _danosCtrl.dispose();
    _kmCtrl.dispose();
    super.dispose();
  }

  bool get _kmMenor {
    final anterior = widget.vehiculo.kilometrajeActual;
    final nuevo = int.tryParse(_kmCtrl.text);
    return anterior != null && nuevo != null && nuevo < anterior;
  }

  Future<void> _guardar() async {
    if (_motivoCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Escribe o elige el motivo de ingreso.');
      return;
    }
    setState(() {
      _guardando = true;
      _error = null;
    });
    try {
      final data = await apiClient.post('/api/ordenes', {
        'vehiculo_id': widget.vehiculo.id,
        'motivo_ingreso': _motivoCtrl.text.trim(),
        'kilometraje_ingreso': int.tryParse(_kmCtrl.text),
        'detalles': [],
        'checklist': {
          'nivel_combustible': _combustible,
          ..._tiene,
          'observaciones_recepcion': _danosCtrl.text.trim().isEmpty ? null : _danosCtrl.text.trim(),
        },
      });
      if (mounted) Navigator.pop(context, data['id'] as int);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = mensajeError(e, 'No se pudo crear la orden.');
          _guardando = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    Widget titulo(String t) => Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 8),
          child: Text(t, style: TextStyle(color: c.ink2, fontSize: 15, fontWeight: FontWeight.w600)),
        );

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text('Recibir ${widget.vehiculo.placa}', style: displayStyle(context, size: 28))),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close), tooltip: 'Cerrar'),
              ],
            ),
            titulo('¿Qué necesita?'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final a in _atajos)
                  ActionChip(
                    label: Text(a),
                    onPressed: () => setState(() {
                      _motivoCtrl.text = _motivoCtrl.text.trim().isEmpty ? a : '${_motivoCtrl.text.trim()}. $a';
                      _error = null;
                    }),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _motivoCtrl,
              minLines: 2,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(hintText: 'Motivo de ingreso. Puedes dictarlo con el micrófono del teclado.'),
            ),
            titulo('Kilometraje'),
            TextField(
              controller: _kmCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(suffixText: 'km'),
            ),
            if (_kmMenor) ...[
              const SizedBox(height: 8),
              Aviso('Es menor al de la última visita (${formatoKm(widget.vehiculo.kilometrajeActual)}). Revisa el odómetro.', tono: Tono.warn),
            ],
            titulo('Combustible'),
            SizedBox(
              width: double.infinity,
              child: SegmentedButton<int>(
                showSelectedIcon: false,
                style: const ButtonStyle(visualDensity: VisualDensity.compact),
                segments: [for (final e in combustibleLabels.entries) ButtonSegment(value: e.key, label: Text(e.value, maxLines: 1, softWrap: false))],
                selected: {_combustible},
                onSelectionChanged: (s) => setState(() => _combustible = s.first),
              ),
            ),
            titulo('Ingresa con'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final e in _accesorios.entries)
                  FilterChip(
                    label: Text(e.value),
                    selected: _tiene[e.key]!,
                    onSelected: (v) => setState(() => _tiene[e.key] = v),
                  ),
              ],
            ),
            titulo('Daños visibles'),
            TextField(
              controller: _danosCtrl,
              minLines: 1,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(hintText: 'Rayones, golpes, vidrios o luces rotas'),
            ),
            if (_error != null) ...[const SizedBox(height: 14), Aviso(_error!)],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(onPressed: _guardando ? null : _guardar, child: Text(_guardando ? 'Creando orden…' : 'Crear orden de trabajo')),
            ),
          ],
        ),
      ),
    );
  }
}
