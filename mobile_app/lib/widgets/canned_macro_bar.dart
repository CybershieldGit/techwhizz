// lib/widgets/canned_macro_bar.dart
// ─────────────────────────────────────────────────────────
// Horizontal quick-reply macro bar for fast agent responses.
// Dynamically synchronized with MongoDB Atlas CannedMacro collection.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../providers/agent_provider.dart';

class CannedMacroBar extends StatelessWidget {
  final ValueChanged<String> onSelectMacro;
  final String? customerName;

  const CannedMacroBar({
    super.key,
    required this.onSelectMacro,
    this.customerName,
  });

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgentProvider>();
    final macros = provider.cannedMacros.isNotEmpty
        ? provider.cannedMacros
        : AppConstants.cannedMacros;

    return Container(
      height: 46,
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
        itemCount: macros.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final macro = macros[index];
          final label = macro['label'] ?? macro['title'] ?? 'Macro';
          final text = macro['text'] ?? '';

          return InkWell(
            onTap: () {
              String processed = text;
              if (customerName != null && customerName!.trim().isNotEmpty) {
                final cName = customerName!.trim();
                processed = processed
                    .replaceAll('{customer_name}', cName)
                    .replaceAll('{name}', cName)
                    .replaceAll('{customer}', cName);
              }
              onSelectMacro(processed);
            },
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
