// lib/core/theme.dart
// ─────────────────────────────────────────────────────────
// OmniFlow BPO Design System — mirrors the web app CSS tokens exactly.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';

class AppColors {
  // ── Brand Palette ─────────────────────────────────────────
  static const Color blue = Color(0xFF2563EB);
  static const Color blueHover = Color(0xFF1D4ED8);
  static const Color emerald = Color(0xFF059669);
  static const Color emeraldLight = Color(0xFF10B981);
  static const Color amber = Color(0xFFD97706);
  static const Color rose = Color(0xFFE11D48);
  static const Color purple = Color(0xFF7C3AED);

  // ── Backgrounds ───────────────────────────────────────────
  static const Color bgPrimary = Color(0xFFF8FAFC);
  static const Color bgWhite = Color(0xFFFFFFFF);
  static const Color bgInput = Color(0xFFF8FAFC);
  static const Color bgCard = Color(0xFFFFFFFF);

  // ── Text ──────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF94A3B8);

  // ── Border ────────────────────────────────────────────────
  static const Color border = Color(0xFFE2E8F0);

  // ── Status Indicators ─────────────────────────────────────
  static const Color statusAvailable = Color(0xFF10B981);
  static const Color statusInChat = Color(0xFF2563EB);
  static const Color statusBusy = Color(0xFFF59E0B);
  static const Color statusOffline = Color(0xFF94A3B8);
  static const Color statusTerminated = Color(0xFFE11D48);

  // ── Message Bubbles ───────────────────────────────────────
  static const Color agentBubble = Color(0xFF059669);    // Emerald for agent
  static const Color customerBubble = Color(0xFFFFFFFF); // White for customer
  static const Color systemBubble = Color(0xFFFFFFFF);

  // ── Semantic ──────────────────────────────────────────────
  static const Color successBg = Color(0xFFECFDF5);
  static const Color successBorder = Color(0xFFA7F3D0);
  static const Color warningBg = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);
  static const Color errorBg = Color(0xFFFFF1F2);
  static const Color errorBorder = Color(0xFFFECDD3);
  static const Color infoBg = Color(0xFFEFF6FF);
  static const Color infoBorder = Color(0xFFBFDBFE);
}

class AppTextStyles {
  static const String fontFamily = 'Roboto'; // system font fallback

  static const TextStyle headline1 = TextStyle(
    fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );
  static const TextStyle headline2 = TextStyle(
    fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );
  static const TextStyle headline3 = TextStyle(
    fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary,
  );
  static const TextStyle body = TextStyle(
    fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.textSecondary,
    height: 1.5,
  );
  static const TextStyle bodyBold = TextStyle(
    fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary,
  );
  static const TextStyle caption = TextStyle(
    fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textMuted,
  );
  static const TextStyle captionBold = TextStyle(
    fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted,
    letterSpacing: 0.5,
  );
  static const TextStyle button = TextStyle(
    fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.bgWhite,
  );
  static const TextStyle label = TextStyle(
    fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155),
  );
}

class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.bgPrimary,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.blue,
        brightness: Brightness.light,
        primary: AppColors.blue,
        secondary: AppColors.emerald,
        surface: AppColors.bgWhite,
        error: AppColors.rose,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgWhite,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: AppColors.border,
        titleTextStyle: AppTextStyles.headline3,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgInput,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.blue, width: 1.5),
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
        labelStyle: AppTextStyles.label,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.blue,
          foregroundColor: Colors.white,
          textStyle: AppTextStyles.button,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          elevation: 2,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.bgWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.textPrimary,
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

// ── Helper widgets ────────────────────────────────────────
class AppShadows {
  static List<BoxShadow> get sm => [
    const BoxShadow(color: Color(0x0F000000), blurRadius: 3, offset: Offset(0, 1)),
    const BoxShadow(color: Color(0x0A000000), blurRadius: 2, offset: Offset(0, 1)),
  ];
  static List<BoxShadow> get md => [
    const BoxShadow(color: Color(0x0F000000), blurRadius: 16, offset: Offset(0, 4)),
    const BoxShadow(color: Color(0x0A000000), blurRadius: 6, offset: Offset(0, 2)),
  ];
  static List<BoxShadow> get lg => [
    const BoxShadow(color: Color(0x14000000), blurRadius: 30, offset: Offset(0, 12)),
    const BoxShadow(color: Color(0x0A000000), blurRadius: 12, offset: Offset(0, 4)),
  ];
}
