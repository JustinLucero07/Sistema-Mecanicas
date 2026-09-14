import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_shell.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthService(),
      child: const TallerMecanicaApp(),
    ),
  );
}

class TallerMecanicaApp extends StatelessWidget {
  const TallerMecanicaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Taller Mecánica',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F172A)),
        useMaterial3: true,
        navigationBarTheme: const NavigationBarThemeData(
          indicatorColor: Color(0xFFE2E8F0),
        ),
      ),
      home: const _RaizApp(),
    );
  }
}

class _RaizApp extends StatelessWidget {
  const _RaizApp();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    if (auth.cargando) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return auth.autenticado ? const HomeShell() : const LoginScreen();
  }
}
