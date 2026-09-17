import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
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
  File? _imagenCapturada;
  late AnimationController _laserController;
  final TextEditingController _manualController = TextEditingController();

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
    _manualController.dispose();
    super.dispose();
  }

  Future<void> _capturarImagen(ImageSource source) async {
    final isDesktop = Platform.isLinux || Platform.isWindows || Platform.isMacOS;
    final picker = ImagePicker();
    XFile? foto;

    try {
      // En plataformas de escritorio jamás pasamos ImageSource.camera porque image_picker_linux carece de cámara nativa
      final effectiveSource = isDesktop ? ImageSource.gallery : source;
      foto = await picker.pickImage(source: effectiveSource, imageQuality: 85);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'No se pudo abrir el selector de imagen: $e');
      return;
    }

    if (foto == null) return;

    final archivoFoto = File(foto.path);
    setState(() {
      _imagenCapturada = archivoFoto;
      _procesando = true;
      _error = null;
      _resultado = null;
    });

    try {
      final data = await apiClient.postFile('/api/vehiculos/escanear-placa', archivoFoto);
      if (!mounted) return;
      setState(() {
        _resultado = PlacaDetectada.fromJson(data);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e is ApiException ? e.message : 'Error al procesar la imagen de la placa');
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  Future<void> _probarFotoDemo() async {
    setState(() {
      _procesando = true;
      _error = null;
      _resultado = null;
    });

    try {
      final tempDir = Directory.systemTemp;
      final tempFile = File('${tempDir.path}/placa_demo_${DateTime.now().millisecondsSinceEpoch}.bmp');
      await tempFile.writeAsBytes(_generarBmpDemo());

      setState(() => _imagenCapturada = tempFile);

      final data = await apiClient.postFile('/api/vehiculos/escanear-placa', tempFile);
      if (!mounted) return;
      setState(() {
        _resultado = PlacaDetectada.fromJson(data);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e is ApiException ? e.message : 'Error al probar demo OCR: $e');
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  Uint8List _generarBmpDemo() {
    const width = 140;
    const height = 45;
    const rowSize = (width * 3 + 3) & ~3;
    final imageSize = rowSize * height;
    final fileSize = 54 + imageSize;

    final data = ByteData(fileSize);
    data.setUint8(0, 0x42); // 'B'
    data.setUint8(1, 0x4D); // 'M'
    data.setUint32(2, fileSize, Endian.little);
    data.setUint32(10, 54, Endian.little);
    data.setUint32(14, 40, Endian.little);
    data.setInt32(18, width, Endian.little);
    data.setInt32(22, height, Endian.little);
    data.setUint16(26, 1, Endian.little);
    data.setUint16(28, 24, Endian.little);
    data.setUint32(34, imageSize, Endian.little);

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final offset = 54 + y * rowSize + x * 3;
        final isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
        if (isBorder) {
          data.setUint8(offset, 0x0F);
          data.setUint8(offset + 1, 0x17);
          data.setUint8(offset + 2, 0x2A);
        } else {
          data.setUint8(offset, 0xF8);
          data.setUint8(offset + 1, 0xFA);
          data.setUint8(offset + 2, 0xFC);
        }
      }
    }
    return data.buffer.asUint8List();
  }

  Future<void> _buscarPlacaDirecta(String placaInput) async {
    final placa = placaInput.trim().toUpperCase();
    if (placa.isEmpty) return;

    setState(() {
      _procesando = true;
      _error = null;
      _resultado = null;
    });

    try {
      final vehiculoData = await apiClient.get('/api/vehiculos/by-placa/$placa').catchError((_) => null);
      if (!mounted) return;
      setState(() {
        _resultado = PlacaDetectada(
          placaTexto: placa,
          confianza: 1.0,
          vehiculo: vehiculoData != null ? Vehiculo.fromJson(vehiculoData) : null,
          fotoUrl: '',
        );
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Error al consultar la placa $placa');
    } finally {
      if (mounted) setState(() => _procesando = false);
    }
  }

  Future<void> _editarPlacaManual() async {
    if (_resultado == null) return;
    final controller = TextEditingController(text: _resultado!.placaTexto);

    final nuevaPlaca = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.edit_note_rounded, color: Color(0xFFF97316)),
            SizedBox(width: 8),
            Text('Corregir Placa Detectada', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Si el OCR leyó un carácter erróneo (ej. O por 0), cámbialo a continuación:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              autofocus: true,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Placa Normalizada',
                hintText: 'ABC-1234',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.credit_card),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim().toUpperCase()),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFF97316)),
            child: const Text('Guardar y Re-consultar'),
          ),
        ],
      ),
    );

    if (nuevaPlaca != null && nuevaPlaca.isNotEmpty && nuevaPlaca != _resultado!.placaTexto) {
      _buscarPlacaDirecta(nuevaPlaca);
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

  void _abrirWhatsApp(String telefono, String nombre) async {
    final clean = telefono.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('https://wa.me/$clean?text=${Uri.encodeComponent("Hola $nombre, le escribimos desde el taller mecánico.")}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
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
            tooltip: 'Probar Foto Demo OCR',
            onPressed: _procesando ? null : _probarFotoDemo,
            icon: const Icon(Icons.science_rounded, color: Color(0xFF06B6D4)),
          ),
          TextButton.icon(
            onPressed: _procesando ? null : () => _buscarPlacaDirecta('ABC-1234'),
            icon: const Icon(Icons.bolt_rounded, color: Colors.amber, size: 20),
            label: const Text('Placa Directa', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // HUD / VISOR HOLOGRÁFICO DE CÁMARA
            Container(
              height: 230,
              decoration: BoxDecoration(
                color: const Color(0xFF090D16),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFCBD5E1),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Imagen Capturada o Fondo Oscuro
                  if (_imagenCapturada != null) ...[
                    Image.file(
                      _imagenCapturada!,
                      fit: BoxFit.cover,
                    ),
                    Container(
                      color: Colors.black.withValues(alpha: 0.35),
                    ),
                  ],

                  // HUD Decorativo (Completamente excluido de accesibilidad y layouts)
                  Positioned.fill(
                    child: ExcludeSemantics(
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // Badge IA Vision Status
                          Positioned(
                            top: 14,
                            left: 20,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.4)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF10B981),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'MOTOR IA LPR / OCR',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.8,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Brackets / Esquinas HUD
                          Positioned(
                            top: 16,
                            left: 16,
                            child: Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                border: Border(
                                  top: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                  left: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            top: 16,
                            right: 16,
                            child: Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                border: Border(
                                  top: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                  right: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 16,
                            left: 16,
                            child: Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                border: Border(
                                  bottom: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                  left: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 16,
                            right: 16,
                            child: Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                border: Border(
                                  bottom: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                  right: BorderSide(color: Color(0xFFF97316), width: 3.5),
                                ),
                              ),
                            ),
                          ),

                          // Barrido Láser Animado: Renderizado puro por Canvas (cero layout passes)
                          Positioned.fill(
                            child: RepaintBoundary(
                              child: AnimatedBuilder(
                                animation: _laserController,
                                builder: (context, _) => CustomPaint(
                                  painter: _LaserScanPainter(
                                    progress: _laserController.value,
                                    color: const Color(0xFFF97316),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Centro: Icono o Estado
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _imagenCapturada != null ? Icons.check_circle_outline_rounded : Icons.camera_alt_rounded,
                          size: 44,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _procesando
                              ? 'PROCESANDO VISIÓN ARTIFICIAL...'
                              : (_imagenCapturada != null ? 'FOTO CARGADA' : 'ENCUADRA LA PLACA DEL VEHÍCULO'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ERROR BANNER ELEGANTE
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // RESULTADO DETECTADO: FICHA Y ACCIÓN DIRECTA
            if (_resultado != null) ...[
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131B2E) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFF97316).withValues(alpha: 0.4),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header de la tarjeta con confianza y corrección
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'PLACA IDENTIFICADA',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 0.8),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, size: 13, color: Color(0xFF10B981)),
                              const SizedBox(width: 4),
                              Text(
                                '${(_resultado!.confianza * 100).toInt()}% confianza',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // CHAPA METÁLICA DE PLACA CON BOTÓN DE EDITAR
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFFFFFF), Color(0xFFE2E8F0)],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF1E293B), width: 2.5),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 6,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Text(
                              _resultado!.placaTexto,
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.5,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: _editarPlacaManual,
                            icon: const Icon(Icons.edit_rounded, color: Color(0xFFF97316)),
                            tooltip: 'Corregir placa manualmente',
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // INFO VEHÍCULO O BANNER DE REGISTRO
                    if (_resultado!.vehiculo != null) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    '${_resultado!.vehiculo!.marca ?? ""} ${_resultado!.vehiculo!.modelo ?? ""} (${_resultado!.vehiculo!.anio ?? ""})',
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _resultado!.vehiculo!.estado == 'en_taller'
                                        ? Colors.amber.withValues(alpha: 0.2)
                                        : const Color(0xFF10B981).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _resultado!.vehiculo!.estado == 'en_taller' ? 'EN TALLER' : 'ACTIVO',
                                    style: TextStyle(
                                      color: _resultado!.vehiculo!.estado == 'en_taller' ? Colors.amber : const Color(0xFF10B981),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (_resultado!.vehiculo!.cliente != null) ...[
                              Row(
                                children: [
                                  const Icon(Icons.person_outline_rounded, size: 15, color: Colors.grey),
                                  const SizedBox(width: 5),
                                  Text(
                                    _resultado!.vehiculo!.cliente!.nombre,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  if (_resultado!.vehiculo!.cliente!.telefono != null &&
                                      _resultado!.vehiculo!.cliente!.telefono!.isNotEmpty) ...[
                                    const Spacer(),
                                    InkWell(
                                      onTap: () => _abrirWhatsApp(
                                        _resultado!.vehiculo!.cliente!.telefono!,
                                        _resultado!.vehiculo!.cliente!.nombre,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.chat_bubble_outline_rounded, size: 12, color: Color(0xFF10B981)),
                                            SizedBox(width: 4),
                                            Text('WhatsApp', style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                            if (_resultado!.vehiculo!.kilometrajeActual != null) ...[
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.speed_rounded, size: 15, color: Color(0xFFF97316)),
                                  const SizedBox(width: 5),
                                  Text(
                                    'Odómetro: ${_resultado!.vehiculo!.kilometrajeActual!.toLocaleString()} km',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, fontFamily: 'monospace'),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _irAlVehiculo,
                        icon: const Icon(Icons.history_edu_rounded),
                        label: const Text('Abrir Ficha & Historial Clínico'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFF97316),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.info_outline_rounded, color: Colors.amber, size: 22),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Placa no encontrada en la base de datos. ¿Deseas registrar este nuevo vehículo?',
                                style: TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _irAlVehiculo,
                        icon: const Icon(Icons.add_circle_outline_rounded),
                        label: const Text('Registrar Vehículo Ahora'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0891B2),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // BOTONES DE CAPTURA RÁPIDA (CÁMARA / GALERÍA / DEMO)
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _procesando ? null : () => _capturarImagen(ImageSource.camera),
                    icon: Icon(Platform.isLinux || Platform.isWindows || Platform.isMacOS
                        ? Icons.file_upload_outlined
                        : Icons.camera_alt_rounded),
                    label: Text(Platform.isLinux || Platform.isWindows || Platform.isMacOS
                        ? 'Cargar Foto'
                        : 'Abrir Cámara'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFF97316),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _procesando ? null : () => _capturarImagen(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_rounded),
                    label: const Text('Galería'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _procesando ? null : _probarFotoDemo,
              icon: const Icon(Icons.auto_awesome_rounded, color: Color(0xFF06B6D4)),
              label: const Text('🧪 Probar Foto de Muestra con IA (OCR Demo)'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: BorderSide(color: const Color(0xFF06B6D4).withValues(alpha: 0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),

            const SizedBox(height: 24),

            // SECCIÓN: BÚSQUEDA MANUAL DIRECTA (SPEED-FIRST)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF131B2E) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'O BUSCAR MANUALMENTE POR PLACA:',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.6),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _manualController,
                          textCapitalization: TextCapitalization.characters,
                          decoration: InputDecoration(
                            hintText: 'Ej: ABC-1234',
                            prefixIcon: const Icon(Icons.pin_rounded, size: 18),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            isDense: true,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onSubmitted: (val) => _buscarPlacaDirecta(val),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilledButton(
                        onPressed: _procesando ? null : () => _buscarPlacaDirecta(_manualController.text),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Buscar'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

extension NumberFormatExtension on int {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}

class _LaserScanPainter extends CustomPainter {
  final double progress;
  final Color color;

  _LaserScanPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    if (size.height <= 0 || size.width <= 0) return;
    final y = 20.0 + (size.height - 40.0) * progress;

    final glowPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          color.withValues(alpha: 0.3),
          color.withValues(alpha: 0.7),
          color.withValues(alpha: 0.3),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, y - 6, size.width, 12))
      ..strokeWidth = 10
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6)
      ..style = PaintingStyle.stroke;

    final linePaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          color.withValues(alpha: 0.9),
          Colors.white,
          color.withValues(alpha: 0.9),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, y - 1.5, size.width, 3))
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    canvas.drawLine(Offset(20, y), Offset(size.width - 20, y), glowPaint);
    canvas.drawLine(Offset(20, y), Offset(size.width - 20, y), linePaint);
  }

  @override
  bool shouldRepaint(covariant _LaserScanPainter oldDelegate) => oldDelegate.progress != progress;
}
