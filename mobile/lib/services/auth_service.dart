import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService extends ChangeNotifier {
  String? nombre;
  String? rol;
  int? usuarioId;
  bool cargando = true;

  bool get autenticado => nombre != null;
  bool get esMecanico => rol == 'mecanico';

  AuthService() {
    _cargarSesion();
  }

  Future<void> _cargarSesion() async {
    final prefs = await SharedPreferences.getInstance();
    nombre = prefs.getString('nombre');
    rol = prefs.getString('rol');
    usuarioId = prefs.getInt('usuario_id');
    cargando = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await apiClient.post('/api/auth/login', {'email': email, 'password': password});
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['access_token']);
    await prefs.setString('nombre', data['nombre']);
    await prefs.setString('rol', data['rol']);
    await prefs.setInt('usuario_id', data['usuario_id']);
    nombre = data['nombre'];
    rol = data['rol'];
    usuarioId = data['usuario_id'];
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    nombre = null;
    rol = null;
    usuarioId = null;
    notifyListeners();
  }
}
