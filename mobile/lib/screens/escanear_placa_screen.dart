import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import 'vehiculo_detalle_screen.dart';
import 'nuevo_vehiculo_screen.dart';

/// Pantalla central del flujo "escanear placa": el mecánico toma una foto,
/// se manda al backend (YOLO + OCR) y si el vehículo ya existe se abre
/// directo su historial; si no, se ofrece registrarlo con la placa ya leída.
class EscanearPlacaScreen extends StatefulWidget {
  const EscanearPlacaScreen({super.key});

  @override
  State<EscanearPlacaScreen> createState() => _EscanearPlacaScreenState();
}

class _EscanearPlacaScreenState extends State<EscanearPlacaScreen> {
  bool _procesando = false;
  String? _error;

  Future<void> _tomarFoto() async {
    final picker = ImagePicker();
    final foto = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (foto == null) return;

    setState(() {
      _procesando = true;
      _error = null;
    });

    try {
      final data = await apiClient.postFile('/api/vehiculos/escanear-placa', File(foto.path));
      final resultado = PlacaDetectada.fromJson(data);

      if (!mounted) return;

      if (resultado.vehiculo != null) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: resultado.vehiculo!.id)),
        );
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => NuevoVehiculoScreen(placaInicial: resultado.placaTexto)),
        );
      }
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'No se pudo escanear la placa');
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Escanear placa')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.directions_car, size: 72, color: Colors.black26),
              const SizedBox(height: 16),
              const Text(
                'Toma una foto de la placa del vehículo.\nBuscaremos su historial automáticamente.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              if (_error != null) ...[
                Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                const SizedBox(height: 16),
              ],
              FilledButton.icon(
                onPressed: _procesando ? null : _tomarFoto,
                icon: _procesando
                    ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.camera_alt),
                label: Text(_procesando ? 'Analizando placa...' : 'Tomar foto'),
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
