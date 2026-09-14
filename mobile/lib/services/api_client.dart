import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Cambia esto por la URL de tu backend en la VPS al pasar a producción.
/// 10.0.2.2 es el alias del emulador Android hacia el "localhost" de la
/// máquina host; en un dispositivo físico usa la IP de tu backend.
const String kApiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:8000',
);

class ApiException implements Exception {
  final int status;
  final String message;
  ApiException(this.status, this.message);
  @override
  String toString() => message;
}

class ApiClient {
  Future<String?> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<Map<String, String>> _headers({bool json = true}) async {
    final token = await _token();
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

  Future<dynamic> get(String path) async {
    final res = await http.get(Uri.parse('$kApiBaseUrl$path'), headers: await _headers());
    return _decode(res);
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _decode(res);
  }

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) async {
    final res = await http.patch(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _decode(res);
  }

  Future<dynamic> postFile(String path, File file, {String field = 'foto'}) async {
    final request = http.MultipartRequest('POST', Uri.parse('$kApiBaseUrl$path'));
    request.headers.addAll(await _headers(json: false));
    request.files.add(await http.MultipartFile.fromPath(field, file.path));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _decode(res);
  }
}

final apiClient = ApiClient();
