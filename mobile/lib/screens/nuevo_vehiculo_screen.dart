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
  final _colorCtrl = TextEditingController();
  final _kmCtrl = TextEditingController();

  List<Cliente> _clientes = [];
  int? _clienteId;
  bool _guardando = false;
  bool _cargandoClientes = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _placaCtrl = TextEditingController(text: widget.placaInicial ?? '');
    _placaCtrl.addListener(() => setState(() {}));
    _cargarClientes();
  }

  @override
  void dispose() {
    _placaCtrl.dispose();
    _marcaCtrl.dispose();
    _modeloCtrl.dispose();
    _anioCtrl.dispose();
    _colorCtrl.dispose();
    _kmCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargarClientes() async {
    try {
      final data = await apiClient.get('/api/clientes');
      if (!mounted) return;
      setState(() {
        _clientes = (data as List).map((c) => Cliente.fromJson(c)).toList();
        if (_clientes.isNotEmpty) _clienteId = _clientes.first.id;
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _cargandoClientes = false);
    }
  }

  Future<void> _guardar() async {
    final placa = _placaCtrl.text.trim().toUpperCase();
    if (placa.isEmpty) {
      setState(() => _error = 'Ingresa la placa del vehículo');
      return;
    }
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
        'placa': placa,
        'marca': _marcaCtrl.text.trim().isEmpty ? null : _marcaCtrl.text.trim(),
        'modelo': _modeloCtrl.text.trim().isEmpty ? null : _modeloCtrl.text.trim(),
        'anio': int.tryParse(_anioCtrl.text.trim()),
        'color': _colorCtrl.text.trim().isEmpty ? null : _colorCtrl.text.trim(),
        'kilometraje_actual': int.tryParse(_kmCtrl.text.trim()),
        'cliente_id': _clienteId,
      });
      final vehiculo = Vehiculo.fromJson(data);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: vehiculo.id)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e is ApiException ? e.message : 'No se pudo registrar el vehículo');
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final placaTexto = _placaCtrl.text.trim().isEmpty ? 'ABC-1234' : _placaCtrl.text.trim().toUpperCase();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Registrar Nuevo Vehículo'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // PREVISUALIZACIÓN DE CHAPA METÁLICA
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFFFFF), Color(0xFFE2E8F0)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF1E293B), width: 2.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    placaTexto,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.5,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Previsualización de Placa Oficial',
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // TARJETA DE FORMULARIO
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131B2E) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'DATOS PRINCIPALES',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 0.8),
                ),
                const SizedBox(height: 14),

                // Selección de Cliente
                _cargandoClientes
                    ? const LinearProgressIndicator()
                    : DropdownButtonFormField<int>(
                        initialValue: _clienteId,
                        decoration: InputDecoration(
                          labelText: 'Propietario (Cliente) *',
                          prefixIcon: const Icon(Icons.person_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                        items: _clientes
                            .map((c) => DropdownMenuItem(value: c.id, child: Text(c.nombre)))
                            .toList(),
                        onChanged: (v) => setState(() => _clienteId = v),
                      ),

                const SizedBox(height: 14),

                TextField(
                  controller: _placaCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    labelText: 'Placa del Vehículo *',
                    hintText: 'Ej: ABC-1234',
                    prefixIcon: const Icon(Icons.credit_card_rounded),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),

                const SizedBox(height: 14),

                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _marcaCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          labelText: 'Marca',
                          hintText: 'Toyota, Kia...',
                          prefixIcon: const Icon(Icons.directions_car_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _modeloCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          labelText: 'Modelo',
                          hintText: 'Corolla, Sportage...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _anioCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Año Fabricación',
                          hintText: 'Ej: 2022',
                          prefixIcon: const Icon(Icons.calendar_today_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _colorCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          labelText: 'Color',
                          hintText: 'Blanco, Rojo...',
                          prefixIcon: const Icon(Icons.palette_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                TextField(
                  controller: _kmCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Kilometraje Actual (Odómetro)',
                    hintText: 'Ej: 85000',
                    prefixIcon: const Icon(Icons.speed_rounded),
                    suffixText: 'km',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
              ],
            ),
          ),

          if (_error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12))),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          FilledButton.icon(
            onPressed: _guardando ? null : _guardar,
            icon: _guardando
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.check_circle_outline_rounded),
            label: Text(_guardando ? 'Guardando Vehículo...' : 'Guardar y Abrir Ficha Técnica'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFF97316),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ],
      ),
    );
  }
}
