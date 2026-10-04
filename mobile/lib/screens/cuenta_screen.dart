import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets.dart';
import 'terminos_screen.dart';

class CuentaScreen extends StatefulWidget {
  const CuentaScreen({super.key});

  @override
  State<CuentaScreen> createState() => _CuentaScreenState();
}

class _CuentaScreenState extends State<CuentaScreen> {
  final _actual = TextEditingController();
  final _nueva = TextEditingController();
  final _repetir = TextEditingController();
  bool _guardando = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_actual, _nueva, _repetir]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _cambiar() async {
    if (_nueva.text != _repetir.text) {
      setState(() => _error = 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    setState(() {
      _guardando = true;
      _error = null;
    });
    try {
      await context.read<AuthService>().cambiarContrasena(_actual.text, _nueva.text);
      if (!mounted) return;
      for (final c in [_actual, _nueva, _repetir]) {
        c.clear();
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Contraseña cambiada. Tus otras sesiones se cerraron.')));
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudo cambiar la contraseña.'));
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final c = context.c;
    const gap = SizedBox(height: 12);
    return Scaffold(
      appBar: AppBar(title: const Text('Mi cuenta')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          Text(auth.nombre ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          Text(etiqueta(auth.rol ?? ''), style: TextStyle(color: c.ink3, fontSize: 15)),
          const SizedBox(height: 24),
          Text('Cambiar contraseña', style: displayStyle(context, size: 24)),
          const SizedBox(height: 4),
          Text('Al cambiarla se cierran tus sesiones en otros equipos.', style: TextStyle(color: c.ink3, fontSize: 14)),
          const SizedBox(height: 14),
          TextField(controller: _actual, obscureText: true, decoration: const InputDecoration(labelText: 'Contraseña actual')),
          gap,
          TextField(
            controller: _nueva,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Nueva contraseña', helperText: 'Al menos 10 caracteres, con letras y números.'),
          ),
          gap,
          TextField(controller: _repetir, obscureText: true, decoration: const InputDecoration(labelText: 'Repite la nueva contraseña')),
          if (_error != null) ...[gap, Aviso(_error!)],
          const SizedBox(height: 16),
          FilledButton(onPressed: _guardando ? null : _cambiar, child: Text(_guardando ? 'Guardando…' : 'Cambiar contraseña')),
          const SizedBox(height: 28),
          const Divider(),
          ListTile(contentPadding: EdgeInsets.zero, title: const Text('Términos y condiciones'), trailing: const Icon(Icons.open_in_new), onTap: () => abrirLegal('terminos')),
          ListTile(contentPadding: EdgeInsets.zero, title: const Text('Política de privacidad'), trailing: const Icon(Icons.open_in_new), onTap: () => abrirLegal('privacidad')),
          const Divider(),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).popUntil((r) => r.isFirst);
              context.read<AuthService>().logout();
            },
            icon: Icon(Icons.logout, color: c.bad),
            label: Text('Cerrar sesión', style: TextStyle(color: c.bad)),
          ),
        ],
      ),
    );
  }
}
