import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';
import 'nuevo_vehiculo_screen.dart';
import 'vehiculo_detalle_screen.dart';

/// Identificar vehículo: foto de la placa (el servidor la lee) o escrita a
/// mano. La placa leída nunca se busca sola: la persona la confirma primero.
class EscanearPlacaScreen extends StatefulWidget {
  const EscanearPlacaScreen({super.key});

  @override
  State<EscanearPlacaScreen> createState() => _EscanearPlacaScreenState();
}

class _EscanearPlacaScreenState extends State<EscanearPlacaScreen> {
  final _placaCtrl = TextEditingController();
  bool _leyendo = false;
  bool _buscando = false;
  double? _confianza;
  String? _aviso;
  String? _noEncontrada;

  @override
  void dispose() {
    _placaCtrl.dispose();
    super.dispose();
  }

  Future<void> _tomarFoto() async {
    final foto = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85, maxWidth: 1600);
    if (foto == null) return;
    setState(() {
      _leyendo = true;
      _aviso = null;
      _noEncontrada = null;
    });
    try {
      final data = await apiClient.postFoto('/api/vehiculos/escanear-placa', await foto.readAsBytes());
      final resultado = PlacaDetectada.fromJson(data);
      if (!mounted) return;
      setState(() {
        _placaCtrl.text = resultado.placaTexto;
        _confianza = resultado.confianza;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _aviso = e is ApiException && e.status == 503
            ? 'La lectura automática aún no está instalada en el servidor. Escribe la placa a mano.'
            : mensajeError(e, 'No se pudo leer la foto. Escribe la placa a mano.');
      });
    } finally {
      if (mounted) setState(() => _leyendo = false);
    }
  }

  Future<void> _buscar() async {
    final placa = _placaCtrl.text.trim().toUpperCase();
    if (placa.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _buscando = true;
      _aviso = null;
      _noEncontrada = null;
    });
    try {
      final data = await apiClient.get('/api/vehiculos/placa/${Uri.encodeComponent(placa)}');
      final vehiculo = Vehiculo.fromJson(data);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => VehiculoDetalleScreen(vehiculoId: vehiculo.id)));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (e is ApiException && e.status == 404) {
          _noEncontrada = placa;
        } else {
          _aviso = mensajeError(e, 'No se pudo buscar la placa.');
        }
      });
    } finally {
      if (mounted) setState(() => _buscando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Scaffold(
      appBar: AppBar(title: const Text('Identificar vehículo')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            SizedBox(
              height: 64,
              child: FilledButton.icon(
                onPressed: _leyendo ? null : _tomarFoto,
                icon: _leyendo
                    ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: c.brandInk))
                    : const Icon(Icons.photo_camera, size: 26),
                label: Text(_leyendo ? 'Leyendo la placa…' : 'Tomar foto de la placa', style: const TextStyle(fontSize: 18)),
              ),
            ),
            const SizedBox(height: 26),
            Text('O escribe la placa', style: TextStyle(color: c.ink2, fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _placaCtrl,
              textCapitalization: TextCapitalization.characters,
              autocorrect: false,
              textAlign: TextAlign.center,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9-]')), LengthLimitingTextInputFormatter(8)],
              onChanged: (_) => setState(() => _noEncontrada = null),
              onSubmitted: (_) => _buscar(),
              style: TextStyle(fontFamily: kDisplayFont, fontSize: 40, fontWeight: FontWeight.w700, letterSpacing: 3, color: c.ink),
              decoration: InputDecoration(
                hintText: 'ABC-1234',
                hintStyle: TextStyle(fontFamily: kDisplayFont, fontSize: 40, fontWeight: FontWeight.w700, letterSpacing: 3, color: c.lineStrong),
              ),
            ),
            if (_confianza != null && _noEncontrada == null) ...[
              const SizedBox(height: 8),
              Text(
                'Leída de la foto con ${(_confianza! * 100).round()}% de confianza. Revísala antes de buscar.',
                style: TextStyle(color: c.ink3, fontSize: 14),
              ),
            ],
            const SizedBox(height: 14),
            FilledButton(
              onPressed: _buscando || _placaCtrl.text.trim().isEmpty ? null : _buscar,
              child: Text(_buscando ? 'Buscando…' : 'Buscar vehículo'),
            ),
            if (_aviso != null) ...[const SizedBox(height: 16), Aviso(_aviso!, tono: Tono.warn)],
            if (_noEncontrada != null) ...[
              const SizedBox(height: 20),
              Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('No hay ningún vehículo con la placa $_noEncontrada', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('Regístralo para abrirle una orden de trabajo.', style: TextStyle(color: c.ink3, fontSize: 15)),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () => Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => NuevoVehiculoScreen(placaInicial: _noEncontrada)),
                        ),
                        child: const Text('Registrar vehículo'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
