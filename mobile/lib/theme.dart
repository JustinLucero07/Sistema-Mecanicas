import 'package:flutter/material.dart';

/// Tokens de color compartidos con la web. Las pantallas leen de aquí
/// (`context.c`), nunca usan colores fijos, así ambos temas funcionan.
class AppColors extends ThemeExtension<AppColors> {
  final Color canvas, surface, raised, line, lineStrong;
  final Color ink, ink2, ink3;
  final Color brand, brandInk, brandSoft, brandText;
  final Color ok, okSoft, warn, warnSoft, bad, badSoft, info, infoSoft;

  const AppColors({
    required this.canvas,
    required this.surface,
    required this.raised,
    required this.line,
    required this.lineStrong,
    required this.ink,
    required this.ink2,
    required this.ink3,
    required this.brand,
    required this.brandInk,
    required this.brandSoft,
    required this.brandText,
    required this.ok,
    required this.okSoft,
    required this.warn,
    required this.warnSoft,
    required this.bad,
    required this.badSoft,
    required this.info,
    required this.infoSoft,
  });

  static const light = AppColors(
    canvas: Color(0xFFF2F3F0),
    surface: Color(0xFFFFFFFF),
    raised: Color(0xFFF6F7F4),
    line: Color(0xFFE1E4DF),
    lineStrong: Color(0xFFC6CCC4),
    ink: Color(0xFF16202A),
    ink2: Color(0xFF45525F),
    ink3: Color(0xFF68747F),
    brand: Color(0xFF0B6B6B),
    brandInk: Color(0xFFFFFFFF),
    brandSoft: Color(0xFFE0EFEC),
    brandText: Color(0xFF0B6B6B),
    ok: Color(0xFF17754A),
    okSoft: Color(0xFFE2F2E9),
    warn: Color(0xFF99590A),
    warnSoft: Color(0xFFFBEFD3),
    bad: Color(0xFFB1301E),
    badSoft: Color(0xFFFBE5E0),
    info: Color(0xFF2A5AA3),
    infoSoft: Color(0xFFE4ECF8),
  );

  static const dark = AppColors(
    canvas: Color(0xFF0E1418),
    surface: Color(0xFF161F25),
    raised: Color(0xFF1C272F),
    line: Color(0xFF27333C),
    lineStrong: Color(0xFF3B4954),
    ink: Color(0xFFE9EEF1),
    ink2: Color(0xFFB6C2CA),
    ink3: Color(0xFF8D9BA6),
    brand: Color(0xFF3DB5AC),
    brandInk: Color(0xFF05201E),
    brandSoft: Color(0xFF123537),
    brandText: Color(0xFF5FCFC6),
    ok: Color(0xFF55C892),
    okSoft: Color(0xFF143326),
    warn: Color(0xFFF0B341),
    warnSoft: Color(0xFF382A0B),
    bad: Color(0xFFF2877A),
    badSoft: Color(0xFF3C1A15),
    info: Color(0xFF84B3F2),
    infoSoft: Color(0xFF16283F),
  );

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) => t < 0.5 || other is! AppColors ? this : other;
}

extension AppColorsContext on BuildContext {
  AppColors get c => Theme.of(this).extension<AppColors>()!;
}

const kDisplayFont = 'BarlowCondensed';

/// Título grande en la tipografía condensada (la misma de las placas).
TextStyle displayStyle(BuildContext context, {double size = 28}) => TextStyle(
      fontFamily: kDisplayFont,
      fontSize: size,
      fontWeight: FontWeight.w600,
      height: 1.05,
      letterSpacing: -0.2,
      color: context.c.ink,
    );

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;
  final base = ThemeData(brightness: brightness, useMaterial3: true, fontFamily: 'Barlow');

  OutlineInputBorder borde(Color color, [double width = 1]) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: color, width: width),
      );

  return base.copyWith(
    extensions: [c],
    scaffoldBackgroundColor: c.canvas,
    colorScheme: ColorScheme.fromSeed(seedColor: c.brand, brightness: brightness).copyWith(
      primary: c.brand,
      onPrimary: c.brandInk,
      surface: c.surface,
      onSurface: c.ink,
      error: c.bad,
      outline: c.lineStrong,
      surfaceTint: Colors.transparent,
    ),
    textTheme: base.textTheme.apply(bodyColor: c.ink, displayColor: c.ink),
    dividerTheme: DividerThemeData(color: c.line, thickness: 1, space: 1),
    appBarTheme: AppBarTheme(
      backgroundColor: c.canvas,
      foregroundColor: c.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(fontFamily: kDisplayFont, fontSize: 24, fontWeight: FontWeight.w600, color: c.ink),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.brand,
        foregroundColor: c.brandInk,
        minimumSize: const Size(64, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontFamily: 'Barlow', fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.ink,
        backgroundColor: c.surface,
        minimumSize: const Size(64, 52),
        side: BorderSide(color: c.lineStrong),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontFamily: 'Barlow', fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: c.brandText,
        textStyle: const TextStyle(fontFamily: 'Barlow', fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      hintStyle: TextStyle(color: c.ink3),
      labelStyle: TextStyle(color: c.ink2),
      border: borde(c.lineStrong),
      enabledBorder: borde(c.lineStrong),
      focusedBorder: borde(c.brand, 2),
      errorBorder: borde(c.bad),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.surface,
      indicatorColor: c.brandSoft,
      height: 68,
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(color: s.contains(WidgetState.selected) ? c.brandText : c.ink3),
      ),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => TextStyle(
          fontFamily: 'Barlow',
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: s.contains(WidgetState.selected) ? c.ink : c.ink3,
        ),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.ink,
      contentTextStyle: TextStyle(fontFamily: 'Barlow', color: c.canvas, fontSize: 15),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: c.brand),
  );
}
