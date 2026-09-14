// Smoke test: la app arranca y muestra la pantalla de login cuando no hay
// sesión guardada.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/main.dart';
import 'package:mobile/services/auth_service.dart';

void main() {
  testWidgets('Muestra el login cuando no hay sesión', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      ChangeNotifierProvider(create: (_) => AuthService(), child: const TallerMecanicaApp()),
    );
    await tester.pumpAndSettle();

    expect(find.text('Taller Mecánica'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Ingresar'), findsOneWidget);
  });
}
