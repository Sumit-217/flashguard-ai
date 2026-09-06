import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_constants.dart';

/// A deliberately restrained, dark "instrument panel" theme.
///
/// No gradients, no drop shadows, no rounded pastel cards — flat panels,
/// hairline dividers, small square-ish corners, and a monospace face for
/// numeric readouts (risk scores, mm, %, coordinates) so the app reads more
/// like a monitoring console than a generic AI-generated app shell. Colour
/// is reserved almost entirely for risk-tier signalling.
class AppColors {
  AppColors._();

  static const Color background = Color(0xFF0B0D0F);
  static const Color surface = Color(0xFF14171A);
  static const Color surfaceRaised = Color(0xFF1B1F23);
  static const Color hairline = Color(0xFF2A2F34);
  static const Color textPrimary = Color(0xFFE7EAEC);
  static const Color textSecondary = Color(0xFF8C959D);
  static const Color textMuted = Color(0xFF5C646B);

  static const Color accent = Color(0xFF3FA9F5); // used sparingly (links, focus)

  static const Color low = Color(0xFF4CAF7D);
  static const Color moderate = Color(0xFFD9A441);
  static const Color high = Color(0xFFE07B39);
  static const Color critical = Color(0xFFE24C4C);
  static const Color unknown = Color(0xFF5C646B);

  static Color forTier(RiskTier tier) {
    switch (tier) {
      case RiskTier.low:
        return low;
      case RiskTier.moderate:
        return moderate;
      case RiskTier.high:
        return high;
      case RiskTier.critical:
        return critical;
      case RiskTier.unknown:
        return unknown;
    }
  }
}

class AppTheme {
  AppTheme._();

  static TextTheme _textTheme(TextTheme base) {
    return GoogleFonts.interTextTheme(base).copyWith(
      // Reserve the monospace face for call sites that display numeric
      // telemetry (see AppTheme.numeric) rather than the whole app.
    );
  }

  static TextStyle numeric({
    double fontSize = 16,
    FontWeight fontWeight = FontWeight.w600,
    Color? color,
    double? letterSpacing,
  }) {
    return GoogleFonts.jetBrainsMono(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color ?? AppColors.textPrimary,
      letterSpacing: letterSpacing,
    );
  }

  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: base.colorScheme.copyWith(
        surface: AppColors.background,
        primary: AppColors.accent,
        secondary: AppColors.accent,
      ),
      textTheme: _textTheme(base.textTheme).apply(
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.jetBrainsMono(
          color: AppColors.textPrimary,
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.1,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.hairline,
        thickness: 1,
        space: 1,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(3),
          side: const BorderSide(color: AppColors.hairline),
        ),
      ),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.accent,
        linearTrackColor: AppColors.hairline,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.textPrimary,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.surfaceRaised,
        contentTextStyle: const TextStyle(color: AppColors.textPrimary),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(3),
          side: const BorderSide(color: AppColors.hairline),
        ),
      ),
      dropdownMenuTheme: DropdownMenuThemeData(
        menuStyle: MenuStyle(
          backgroundColor: WidgetStateProperty.all(AppColors.surfaceRaised),
        ),
      ),
    );
  }
}
