import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_client.dart';

class ClientesScreen extends StatefulWidget {
  const ClientesScreen({super.key});

  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  List<Cliente> _clientes = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final data = await apiClient.get('/api/clientes');
      setState(() => _clientes = (data as List).map((c) => Cliente.fromJson(c)).toList());
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Error al cargar clientes');
    }
  }

  Future<void> _nuevoCliente() async {
    final creado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _NuevoClienteSheet(),
    );
    if (creado == true) _cargar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      floatingActionButton: FloatingActionButton(onPressed: _nuevoCliente, child: const Icon(Icons.add)),
      body: _error != null
          ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
          : _clientes.isEmpty
              ? const Center(child: Text('No hay clientes registrados todavía.'))
              : ListView.separated(
                  itemCount: _clientes.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final c = _clientes[i];
                    return ListTile(
                      title: Text(c.nombre),
                      subtitle: Text([c.telefono, c.email].where((e) => e != null && e.isNotEmpty).join(' · ')),
                    );
                  },
                ),
    );
  }
}

class _NuevoClienteSheet extends StatefulWidget {
  const _NuevoClienteSheet();

  @override
  State<_NuevoClienteSheet> createState() => _NuevoClienteSheetState();
}

class _NuevoClienteSheetState extends State<_NuevoClienteSheet> {
  final _nombreCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _cedulaCtrl = TextEditingController();
  bool _guardando = false;
  String? _error;

  Future<void> _guardar() async {
    if (_nombreCtrl.text.isEmpty) {
      setState(() => _error = 'El nombre es obligatorio');
      return;
    }
    setState(() {
      _guardando = true;
      _error = null;
    });
    try {
      await apiClient.post('/api/clientes', {
        'nombre': _nombreCtrl.text,
        'telefono': _telefonoCtrl.text.isEmpty ? null : _telefonoCtrl.text,
        'cedula_ruc': _cedulaCtrl.text.isEmpty ? null : _cedulaCtrl.text,
      });
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'No se pudo crear el cliente');
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Nuevo cliente', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _nombreCtrl,
            decoration: const InputDecoration(labelText: 'Nombre completo', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _telefonoCtrl,
            decoration: const InputDecoration(labelText: 'Teléfono', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _cedulaCtrl,
            decoration: const InputDecoration(labelText: 'Cédula / RUC', border: OutlineInputBorder()),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _guardando ? null : _guardar,
            child: _guardando ? const CircularProgressIndicator(strokeWidth: 2) : const Text('Guardar'),
          ),
        ],
      ),
    );
  }
}
