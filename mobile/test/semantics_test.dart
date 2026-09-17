import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/screens/home_shell.dart';
import 'package:mobile/screens/escanear_placa_screen.dart';
import 'package:mobile/services/auth_service.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Test semantics on HomeShell with pointer events', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthService(),
        child: const MaterialApp(
          home: HomeShell(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));
    final gesture = await tester.createGesture(kind: PointerDeviceKind.mouse);
    await gesture.addPointer(location: Offset.zero);
    await gesture.moveTo(const Offset(200, 200));
    await tester.pump();
    await gesture.moveTo(const Offset(300, 400));
    await tester.pump();
    await gesture.removePointer();
    await tester.pump(const Duration(milliseconds: 500));
    handle.dispose();
  });

  testWidgets('Test semantics on EscanearPlacaScreen', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthService(),
        child: const MaterialApp(
          home: EscanearPlacaScreen(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));
    // Try tapping capture button
    final btnFinder = find.byType(FilledButton).first;
    expect(btnFinder, findsOneWidget);
    await tester.tap(btnFinder);
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 500));
    handle.dispose();
  });
}
