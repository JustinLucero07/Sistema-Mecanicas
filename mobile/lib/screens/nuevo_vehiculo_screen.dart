import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';
import 'clientes_screen.dart';
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
  final _kmCtrl = TextEditingController();

  List<Cliente>? _clientes;
  int? _clienteId;
  bool _guardando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _placaCtrl = TextEditingController(text: widget.placaInicial ?? '');
    _cargarClientes();
  }

  @override
  void dispose() {
    for (final c in [_placaCtrl, _marcaCtrl, _modeloCtrl, _anioCtrl, _kmCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _cargarClientes() async {
    try {
      final data = await apiClient.get('/api/clientes') as List;
      if (mounted) setState(() => _clientes = data.map((c) => Cliente.fromJson(c)).toList());
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudieron cargar los clientes.'));
    }
  }

  Future<void> _nuevoCliente() async {
    final creado = await showModalBottomSheet<Cliente>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const NuevoClienteSheet(),
    );
    if (creado == null) return;
    await _cargarClientes();
    if (mounted) setState(() => _clienteId = creado.id);
  }

  Future<void> _guardar() async {
    if (_clienteId == null || _placaCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Elige el propietario y escribe la placa.');
      return;
    }
    setState(() {
      _guardando = true;
      _error = null;
    });
    String? texto(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();
    try {
      final data = await apiClient.post('/api/vehiculos', {
        'placa': _placaCtrl.text.trim().toUpperCase(),
        'marca': texto(_marcaCtrl),
        'modelo': texto(_modeloCtrl),
        'anio': int.tryParse(_anioCtrl.text),
        'kilometraje_actual': int.tryParse(_kmCtrl.text),
        'cliente_id': _clienteId,
      });
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: Vehiculo.fromJson(data).id)),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = mensajeError(e, 'No se pudo registrar el vehículo.');
          _guardando = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    const gap = SizedBox(height: 14);
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar vehículo')),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: FilledButton(onPressed: _guardando ? null : _guardar, child: Text(_guardando ? 'Guardando…' : 'Registrar vehículo')),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          TextField(
            controller: _placaCtrl,
            textCapitalization: TextCapitalization.characters,
            autocorrect: false,
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9-]')), LengthLimitingTextInputFormatter(8)],
            style: TextStyle(fontFamily: kDisplayFont, fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: 2, color: c.ink),
            decoration: const InputDecoration(labelText: 'Placa'),
          ),
          gap,
          DropdownButtonFormField<int>(
            initialValue: _clienteId,
            isExpanded: true,
            decoration: InputDecoration(labelText: _clientes == null ? 'Cargando clientes…' : 'Propietario'),
            items: [for (final cl in _clientes ?? <Cliente>[]) DropdownMenuItem(value: cl.id, child: Text(cl.nombreCompleto, overflow: TextOverflow.ellipsis))],
            onChanged: (v) => setState(() => _clienteId = v),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(onPressed: _nuevoCliente, icon: const Icon(Icons.person_add_alt_1_outlined), label: const Text('El dueño es un cliente nuevo')),
          ),
          TextField(controller: _marcaCtrl, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Marca')),
          gap,
          TextField(controller: _modeloCtrl, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Modelo')),
          gap,
          Row(children: [
            Expanded(child: TextField(controller: _anioCtrl, keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(4)], decoration: const InputDecoration(labelText: 'Año'))),
            const SizedBox(width: 12),
            Expanded(child: TextField(controller: _kmCtrl, keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly], decoration: const InputDecoration(labelText: 'Kilometraje'))),
          ]),
          if (_error != null) ...[gap, Aviso(_error!, tono: Tono.bad)],
        ],
      ),
    );
  }
}
