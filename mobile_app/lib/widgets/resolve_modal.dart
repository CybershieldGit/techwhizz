// lib/widgets/resolve_modal.dart
// ─────────────────────────────────────────────────────────
// Resolution confirmation dialog matching the web app.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../core/theme.dart';

class ResolveModal extends StatefulWidget {
  final ValueChanged<String> onConfirm;

  const ResolveModal({
    super.key,
    required this.onConfirm,
  });

  static Future<void> show(
    BuildContext context, {
    required ValueChanged<String> onConfirm,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => ResolveModal(onConfirm: onConfirm),
    );
  }

  @override
  State<ResolveModal> createState() => _ResolveModalState();
}

class _ResolveModalState extends State<ResolveModal> {
  final TextEditingController _summaryController = TextEditingController();
  String _selectedTag = 'Issue Resolved';

  final List<String> _tags = [
    'Issue Resolved',
    'Config Applied',
    'Customer Inactive',
    'Escalated to L2',
  ];

  @override
  void dispose() {
    _summaryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      contentPadding: const EdgeInsets.all(20),
      titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.rose.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.check_circle_outline, color: AppColors.rose, size: 22),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Resolve & Close Chat',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Closing this session will mark the inquiry as resolved and return you to the active queue.',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),

            // Outcome Tags
            const Text(
              'Quick Outcome',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: _tags.map((tag) {
                final isSelected = _selectedTag == tag;
                return ChoiceChip(
                  label: Text(tag),
                  selected: isSelected,
                  selectedColor: AppColors.emerald.withValues(alpha: 0.15),
                  labelStyle: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? AppColors.emerald : AppColors.textSecondary,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedTag = tag);
                    }
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Resolution Notes / Summary
            const Text(
              'Resolution Summary',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _summaryController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Enter notes on how this inquiry was addressed...',
                hintStyle: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                filled: true,
                fillColor: AppColors.bgInput,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
            ),
          ],
        ),
      ),
      actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text(
            'Cancel',
            style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            final summary = _summaryController.text.trim().isNotEmpty
                ? '[$_selectedTag] ${_summaryController.text.trim()}'
                : '[$_selectedTag] Resolved successfully';
            Navigator.pop(context);
            widget.onConfirm(summary);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.rose,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Confirm Resolution'),
        ),
      ],
    );
  }
}
