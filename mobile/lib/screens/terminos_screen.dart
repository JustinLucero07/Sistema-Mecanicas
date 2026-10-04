import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import '../widgets.dart';

/// Dirección de la web, donde viven los textos legales.
const kWebUrl = String.fromEnvironment('WEB_URL', defaultValue: 'http://localhost:3000');

Future<void> abrirLegal(String pagina) =>
    launchUrl(Uri.parse('$kWebUrl/legal/$pagina'), mode: LaunchMode.externalApplication);

/// Cada usuario acepta la versión vigente de los términos antes de usar la app.
class TerminosScreen extends StatefulWidget {
  const TerminosScreen({super.key});

  @override
  State<TerminosScreen> createState() => _TerminosScreenState();
}

class _TerminosScreenState extends State<TerminosScreen> {
  bool _acepta = false;
  bool _guardando = false;
  String? _error;

  Future<void> _aceptar() async {
    setState(() {
      _guardando = true;
      _error = null;
    });
    try {
      await context.read<AuthService>().aceptarTerminos();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = mensajeError(e, 'No se pudo registrar la aceptación.');
          _guardando = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text('Antes de empezar', style: displayStyle(context, size: 36)),
            const SizedBox(height: 10),
            Text(
              'Para usar MecánicaOS necesitamos que leas y aceptes los términos de uso y la política de privacidad. '
              'Explican cómo se cuidan los datos del taller y de sus clientes.',
              style: TextStyle(color: c.ink2, fontSize: 16, height: 1.5),
            ),
            const SizedBox(height: 18),
            Align(alignment: Alignment.centerLeft, child: TextButton(onPressed: () => abrirLegal('terminos'), child: const Text('Leer los términos y condiciones'))),
            Align(alignment: Alignment.centerLeft, child: TextButton(onPressed: () => abrirLegal('privacidad'), child: const Text('Leer la política de privacidad'))),
            const SizedBox(height: 12),
            CheckboxListTile(
              value: _acepta,
              onChanged: (v) => setState(() => _acepta = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              title: const Text('Leí y acepto los términos y condiciones y la política de privacidad.'),
            ),
            if (_error != null) ...[const SizedBox(height: 12), Aviso(_error!)],
            const SizedBox(height: 18),
            FilledButton(onPressed: _acepta && !_guardando ? _aceptar : null, child: Text(_guardando ? 'Guardando…' : 'Aceptar y continuar')),
            const SizedBox(height: 8),
            TextButton(onPressed: () => context.read<AuthService>().logout(), child: const Text('Salir')),
          ],
        ),
      ),
    );
  }
}
