import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// URL del backend. En producción se pasa con `--dart-define=API_URL=...`.
/// 10.0.2.2 es el alias del emulador Android hacia el localhost de la PC.
String get kApiBaseUrl {
  const envUrl = String.fromEnvironment('API_URL');
  if (envUrl.isNotEmpty) return envUrl;
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) return 'http://10.0.2.2:8001';
  return 'http://localhost:8001';
}

class ApiException implements Exception {
  final int status;
  final String message;
  ApiException(this.status, this.message);
  @override
  String toString() => message;
}

/// Mensaje legible para mostrar a la persona, sea cual sea el error.
String mensajeError(Object e, String porDefecto) {
  if (e is ApiException) return e.message;
  if (e is http.ClientException) return 'Sin conexión con el servidor. Revisa el wifi o los datos.';
  return porDefecto;
}

class ApiClient {
  Future<Map<String, String>> _headers({bool json = true}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      if (json) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  dynamic _decode(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    String detail = res.reasonPhrase ?? 'Error';
    try {
      final body = jsonDecode(utf8.decode(res.bodyBytes));
      detail = body['detail']?.toString() ?? detail;
    } catch (_) {}
    throw ApiException(res.statusCode, detail);
  }

  Uri _uri(String path) => Uri.parse('$kApiBaseUrl$path');

  Future<dynamic> get(String path) async => _decode(await http.get(_uri(path), headers: await _headers()));

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) async =>
      _decode(await http.post(_uri(path), headers: await _headers(), body: body != null ? jsonEncode(body) : null));

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) async =>
      _decode(await http.patch(_uri(path), headers: await _headers(), body: body != null ? jsonEncode(body) : null));

  /// Sube una foto como multipart. Recibe bytes para funcionar igual en
  /// Android, iOS y web.
  Future<dynamic> postFoto(String path, Uint8List bytes, {Map<String, String> campos = const {}}) async {
    final request = http.MultipartRequest('POST', _uri(path));
    request.headers.addAll(await _headers(json: false));
    request.fields.addAll(campos);
    request.files.add(http.MultipartFile.fromBytes('foto', bytes, filename: 'foto.jpg'));
    return _decode(await http.Response.fromStream(await request.send()));
  }
}

final apiClient = ApiClient();
