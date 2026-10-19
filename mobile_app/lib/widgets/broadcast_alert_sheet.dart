// lib/widgets/broadcast_alert_sheet.dart
// ─────────────────────────────────────────────────────────
// Incoming broadcast alert card & bottom sheet.
// Real-time ticking timer (10s ago, 11s ago...) and live
// customer presence indicators (Customer Online vs Customer Left).
// ─────────────────────────────────────────────────────────

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/theme.dart';

class BroadcastAlertCard extends StatefulWidget {
  final Map<String, dynamic> broadcast;
  final VoidCallback onAccept;
  final VoidCallback? onDismiss;
  final EdgeInsetsGeometry? margin;

  const BroadcastAlertCard({
    super.key,
    required this.broadcast,
    required this.onAccept,
    this.onDismiss,
    this.margin,
  });

  @override
  State<BroadcastAlertCard> createState() => _BroadcastAlertCardState();
}

class _BroadcastAlertCardState extends State<BroadcastAlertCard> {
  Timer? _tickerTimer;

  @override
  void initState() {
    super.initState();
    // Live ticking timer to update the waiting duration every second
    _tickerTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tickerTimer?.cancel();
    super.dispose();
  }

  String _formatElapsed(DateTime? time) {
    if (time == null) return 'Just now';
    final diff = DateTime.now().difference(time.toLocal());
    final sec = diff.inSeconds;
    if (sec < 60) return '${sec}s ago';
    final min = diff.inMinutes;
    final remSec = sec % 60;
    if (min < 60) return '${min}m ${remSec}s ago';
    final hrs = diff.inHours;
    return '${hrs}h ${min % 60}m ago';
  }

  @override
  Widget build(BuildContext context) {
    final broadcast = widget.broadcast;
    final customer = broadcast['customer'] is Map
        ? Map<String, dynamic>.from(broadcast['customer'])
        : {'name': broadcast['customerName'] ?? 'New Customer'};

    final customerName = customer['name'] ?? 'Customer';
    final department = customer['department'] ?? broadcast['department'] ?? 'Support';
    final subject = broadcast['subject'] ?? 'New Customer Inquiry';
    final initialMessage = broadcast['initialMessage'] ?? '';
    final phone = customer['phone'] ?? broadcast['phone'];

    final isCustomerConnected = broadcast['customerConnected'] != false;
    final createdAtStr = broadcast['createdAt']?.toString();
    final createdAt = createdAtStr != null ? DateTime.tryParse(createdAtStr) : null;
    final elapsedText = _formatElapsed(createdAt);

    final borderColor = isCustomerConnected ? AppColors.emerald : AppColors.amber;

    return Container(
      margin: widget.margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCustomerConnected ? Colors.white : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 2),
        boxShadow: [
          BoxShadow(
            color: borderColor.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with department & live tags
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: isCustomerConnected ? AppColors.emerald : AppColors.amber,
                      shape: BoxShape.circle,
                    ),
                  )
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.3, 1.3), duration: 800.ms),
                  const SizedBox(width: 8),
                  Text(
                    'INCOMING DISPATCH',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: isCustomerConnected ? AppColors.emerald : AppColors.amber,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  department.toString().toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.blue,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Real-Time Live Status Row: Ticking Waiting Timer & Customer Presence Mark
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              // Real-Time Live Timer Pill (10s ago, 11s ago...)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.timer_outlined, size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      'Waiting: $elapsedText',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),

              // Customer Presence Mark
              if (isCustomerConnected)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: AppColors.emerald,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Text(
                        'Customer Online',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.emerald,
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: AppColors.rose,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Text(
                        'Customer Left / Disconnected',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.rose,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Customer Name & Subject
          Text(
            customerName,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subject,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),

          if (phone != null && phone.toString().isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.phone, size: 13, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(
                  phone.toString(),
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ],

          if (initialMessage.toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isCustomerConnected ? AppColors.bgInput : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                initialMessage.toString(),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],

          // Warning prompt if customer left the page while waiting
          if (!isCustomerConnected) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, size: 14, color: AppColors.rose),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Customer closed or left page while waiting. You can still accept to review or resolve.',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.rose,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Accept (CLAIM) button
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: widget.onAccept,
              icon: const Icon(Icons.bolt, size: 20),
              label: const Text(
                'ACCEPT CHAT (CLAIM)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: isCustomerConnected ? AppColors.emerald : AppColors.amber,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
