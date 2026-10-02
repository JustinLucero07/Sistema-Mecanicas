import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../widgets.dart';

class ClientesScreen extends StatefulWidget {
  const ClientesScreen({super.key});

  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  List<Cliente>? _clientes;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final data = await apiClient.get('/api/clientes') as List;
      if (!mounted) return;
      setState(() {
        _clientes = data.map((c) => Cliente.fromJson(c)).toList();
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = mensajeError(e, 'No se pudieron cargar los clientes.'));
    }
  }

  Future<void> _nuevo() async {
    final creado = await showModalBottomSheet<Cliente>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const NuevoClienteSheet(),
    );
    if (creado != null) _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final lista = _clientes ?? [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes'),
        actions: [
          TextButton.icon(onPressed: _nuevo, icon: const Icon(Icons.add), label: const Text('Nuevo')),
          const SizedBox(width: 8),
        ],
      ),
      body: _error != null
          ? Padding(padding: const EdgeInsets.all(16), child: Aviso(_error!))
          : _clientes == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _cargar,
                  child: lista.isEmpty
                      ? ListView(children: [
                          Vacio(
                            icono: Icons.people_outline,
                            titulo: 'Aún no hay clientes',
                            descripcion: 'Crea el primero para poder registrar su vehículo.',
                            accion: FilledButton(onPressed: _nuevo, child: const Text('Nuevo cliente')),
                          ),
                        ])
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: lista.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final cl = lista[i];
                            final contacto = [cl.telefono, cl.cedulaRuc].where((e) => e != null && e.isNotEmpty).join(' · ');
                            return Panel(
                              padding: const EdgeInsets.all(14),
                              child: Row(children: [
                                CircleAvatar(
                                  backgroundColor: c.raised,
                                  child: Text(cl.nombre.isEmpty ? '?' : cl.nombre[0].toUpperCase(), style: TextStyle(color: c.ink2, fontWeight: FontWeight.w600)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(cl.nombreCompleto, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                    if (contacto.isNotEmpty) Text(contacto, style: TextStyle(color: c.ink3, fontSize: 14)),
                                  ]),
                                ),
                              ]),
                            );
                          },
                        ),
                ),
    );
  }
}

/// Alta rápida de cliente. Devuelve el cliente creado.
class NuevoClienteSheet extends StatefulWidget {
  const NuevoClienteSheet({super.key});

  @override
  State<NuevoClienteSheet> createState() => _NuevoClienteSheetState();
}

class _NuevoClienteSheetState extends State<NuevoClienteSheet> {
  final _nombreCtrl = TextEditingController();
  final _apellidosCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _cedulaCtrl = TextEditingController();
  bool _guardando = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_nombreCtrl, _apellidosCtrl, _telefonoCtrl, _cedulaCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _guardar() async {
    if (_nombreCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Escribe el nombre del cliente.');
      return;
    }
    setState(() {
      _guardando = true;
      _error = null;
    });
    String? texto(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();
    try {
      final data = await apiClient.post('/api/clientes', {
        'nombre': _nombreCtrl.text.trim(),
        'apellidos': texto(_apellidosCtrl),
        'telefono': texto(_telefonoCtrl),
        'cedula_ruc': texto(_cedulaCtrl),
      });
      if (mounted) Navigator.pop(context, Cliente.fromJson(data));
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = mensajeError(e, 'No se pudo guardar el cliente.');
          _guardando = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 12);
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 18, 16, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Nuevo cliente', style: displayStyle(context, size: 28)),
            const SizedBox(height: 14),
            TextField(controller: _nombreCtrl, autofocus: true, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Nombre')),
            gap,
            TextField(controller: _apellidosCtrl, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Apellidos')),
            gap,
            TextField(controller: _telefonoCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Teléfono')),
            gap,
            TextField(controller: _cedulaCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Cédula o RUC')),
            if (_error != null) ...[gap, Aviso(_error!)],
            const SizedBox(height: 18),
            FilledButton(onPressed: _guardando ? null : _guardar, child: Text(_guardando ? 'Guardando…' : 'Guardar cliente')),
          ],
        ),
      ),
    );
  }
}
