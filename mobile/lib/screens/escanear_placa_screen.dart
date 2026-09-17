import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import 'vehiculo_detalle_screen.dart';
import 'nuevo_vehiculo_screen.dart';

class EscanearPlacaScreen extends StatefulWidget {
  const EscanearPlacaScreen({super.key});

  @override
  State<EscanearPlacaScreen> createState() => _EscanearPlacaScreenState();
}

class _EscanearPlacaScreenState extends State<EscanearPlacaScreen> with SingleTickerProviderStateMixin {
  bool _procesando = false;
  String? _error;
  PlacaDetectada? _resultado;
  late AnimationController _laserController;

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _laserController.dispose();
    super.dispose();
  }

  Future<void> _capturarImagen(ImageSource source) async {
    final picker = ImagePicker();
    final foto = await picker.pickImage(source: source, imageQuality: 85);
    if (foto == null) return;

    setState(() {
      _procesando = true;
      _error = null;
      _resultado = null;
    });

    try {
      final data = await apiClient.postFile('/api/vehiculos/escanear-placa', File(foto.path));
      if (!mounted) return;
      setState(() {
        _resultado = PlacaDetectada.fromJson(data);
      });
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Error al procesar la imagen de la placa');
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  Future<void> _simularDemo(String placa) async {
    setState(() {
      _procesando = true;
      _error = null;
    });

    try {
      // Simula detección instantánea
      await Future.delayed(const Duration(milliseconds: 600));
      final vehiculoData = await apiClient.get('/api/vehiculos/by-placa/$placa').catchError((_) => null);

      if (!mounted) return;
      setState(() {
        _resultado = PlacaDetectada(
          placaTexto: placa,
          confianza: 0.98,
          vehiculo: vehiculoData != null ? Vehiculo.fromJson(vehiculoData) : null,
          fotoUrl: '',
        );
      });
    } catch (e) {
      setState(() => _error = 'No se pudo cargar la simulación');
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  void _irAlVehiculo() {
    if (_resultado == null) return;
    if (_resultado!.vehiculo != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => VehiculoDetalleScreen(vehiculoId: _resultado!.vehiculo!.id),
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => NuevoVehiculoScreen(placaInicial: _resultado!.placaTexto),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Identificar Vehículo (LPR)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.amber),
            tooltip: 'Demo ABC-1234',
            onPressed: _procesando ? null : () => _simularDemo('ABC-1234'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Visor / HUD de Cámara
            Container(
              height: 240,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF070B12) : const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Stack(
                children: [
                  // Esquinas HUD
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFFF97316), width: 3), left: BorderSide(color: Color(0xFFF97316), width: 3)))),
                  ),
                  Positioned(
                    top: 16,
                    right: 16,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFFF97316), width: 3), right: BorderSide(color: Color(0xFFF97316), width: 3)))),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF97316), width: 3), left: BorderSide(color: Color(0xFFF97316), width: 3)))),
                  ),
                  Positioned(
                    bottom: 16,
                    right: 16,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF97316), width: 3), right: BorderSide(color: Color(0xFFF97316), width: 3)))),
                  ),

                  // Animación Láser
                  AnimatedBuilder(
                    animation: _laserController,
                    builder: (context, child) {
                      return Positioned(
                        top: 24 + (_laserController.value * 180),
                        left: 20,
                        right: 20,
                        child: Container(
                          height: 2,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Colors.transparent, Color(0xFFF97316), Colors.transparent],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFF97316).withValues(alpha: 0.8),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  // Instrucción central
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.camera_alt_outlined,
                          size: 40,
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _procesando ? 'ANALIZANDO VISIÓN ARTIFICIAL...' : 'ENCUADRA LA PLACA DEL VEHÍCULO',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Resultado de Detección
            if (_resultado != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131B2E) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.4)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'PLACA DETECTADA',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.check_circle, size: 14, color: Colors.green),
                            const SizedBox(width: 4),
                            Text(
                              '${(_resultado!.confianza * 100).toInt()}% confianza',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Chapa Metálica de Placa
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFFFFFF), Color(0xFFE2E8F0)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF334155), width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          _resultado!.placaTexto,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    if (_resultado!.vehiculo != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_resultado!.vehiculo!.marca ?? ""} ${_resultado!.vehiculo!.modelo ?? ""} (${_resultado!.vehiculo!.anio ?? ""})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              'Propietario: ${_resultado!.vehiculo!.cliente?.nombre ?? "Registrado"}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Vehículo no registrado en la base de datos.',
                          style: TextStyle(fontSize: 12, color: Colors.orange, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    FilledButton.icon(
                      onPressed: _irAlVehiculo,
                      icon: const Icon(Icons.arrow_forward),
                      label: Text(_resultado!.vehiculo != null ? 'Abrir Ficha & Historial Clínico' : 'Registrar Vehículo Ahora'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
              ),
              const SizedBox(height: 16),
            ],

            // Botones de Acción Primarios
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _procesando ? null : () => _capturarImagen(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Abrir Cámara'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _procesando ? null : () => _capturarImagen(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Galería'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            OutlinedButton.icon(
              onPressed: _procesando ? null : () => _simularDemo('ABC-1234'),
              icon: const Icon(Icons.flash_on, color: Colors.orange),
              label: const Text('Simular Prueba Rápida (ABC-1234)'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
