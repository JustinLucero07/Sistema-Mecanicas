import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService extends ChangeNotifier {
  String? nombre;
  String? rol;
  int? usuarioId;
  bool requiereTerminos = false;
  bool cargando = true;

  bool get autenticado => nombre != null;
  bool get esMecanico => rol == 'mecanico';

  AuthService() {
    alExpirarSesion = logout;
    _cargarSesion();
  }

  Future<void> _cargarSesion() async {
    final prefs = await SharedPreferences.getInstance();
    nombre = prefs.getString('nombre');
    rol = prefs.getString('rol');
    usuarioId = prefs.getInt('usuario_id');
    requiereTerminos = prefs.getBool('requiere_terminos') ?? false;
    cargando = false;
    notifyListeners();
  }

  Future<void> _guardar(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['access_token']);
    await prefs.setString('nombre', data['nombre']);
    await prefs.setString('rol', data['rol']);
    await prefs.setInt('usuario_id', data['usuario_id']);
    await prefs.setBool('requiere_terminos', data['requiere_aceptar_terminos'] == true);
    nombre = data['nombre'];
    rol = data['rol'];
    usuarioId = data['usuario_id'];
    requiereTerminos = data['requiere_aceptar_terminos'] == true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    await _guardar(await apiClient.post('/api/auth/login', {'email': email, 'password': password}));
  }

  Future<void> aceptarTerminos() async {
    await apiClient.post('/api/auth/aceptar-terminos');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('requiere_terminos', false);
    requiereTerminos = false;
    notifyListeners();
  }

  /// Cambia la contraseña; el servidor cierra las demás sesiones y entrega un token nuevo.
  Future<void> cambiarContrasena(String actual, String nueva) async {
    await _guardar(await apiClient.post('/api/auth/cambiar-contrasena', {'actual': actual, 'nueva': nueva}));
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    nombre = null;
    rol = null;
    usuarioId = null;
    requiereTerminos = false;
    notifyListeners();
  }
}
