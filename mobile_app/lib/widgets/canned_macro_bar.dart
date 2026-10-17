// lib/widgets/canned_macro_bar.dart
// ─────────────────────────────────────────────────────────
// Horizontal quick-reply macro bar for fast agent responses.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../core/theme.dart';

class CannedMacroBar extends StatelessWidget {
  final ValueChanged<String> onSelectMacro;

  const CannedMacroBar({
    super.key,
    required this.onSelectMacro,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(vertical: 4),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: AppColors.border),
        ),
      ),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        scrollDirection: Axis.horizontal,
        itemCount: AppConstants.cannedMacros.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final macro = AppConstants.cannedMacros[index];
          final label = macro['label'] ?? '';
          final text = macro['text'] ?? '';

          return InkWell(
            onTap: () => onSelectMacro(text),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.bgInput,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
