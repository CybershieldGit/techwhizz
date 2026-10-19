// lib/screens/dashboard_screen.dart
// ─────────────────────────────────────────────────────────
// Agent main workspace dashboard:
// Status toggles, queue metrics, incoming broadcasts to claim,
// and fleet roster.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/theme.dart';
import '../models/chat_model.dart';
import '../providers/agent_provider.dart';
import '../widgets/broadcast_alert_sheet.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Color _getStatusColor(String status) {
    switch (status) {
      case 'available':
        return AppColors.emerald;
      case 'in_chat':
        return AppColors.blue;
      case 'busy':
      case 'away':
        return AppColors.amber;
      case 'break':
        return const Color(0xFF8B5CF6);
      case 'offline':
      default:
        return AppColors.textMuted;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status) {
      case 'available':
        return 'Free (Ready)';
      case 'in_chat':
        return 'In Session';
      case 'busy':
      case 'away':
        return 'Away';
      case 'break':
        return 'On Break';
      case 'offline':
      default:
        return 'Offline';
    }
  }

  Widget _buildSegmentBtn({
    required String label,
    IconData? icon,
    Color? dotColor,
    required bool isActive,
    required Color activeColor,
    required Color activeBg,
    required Color activeBorder,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isActive ? activeBg : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isActive ? activeBorder : Colors.transparent,
                width: 1,
              ),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: activeColor.withValues(alpha: 0.12),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 14, color: isActive ? activeColor : AppColors.textSecondary),
                  const SizedBox(width: 4),
                ] else if (dotColor != null) ...[
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: dotColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                ],
                Flexible(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                      color: isActive ? activeColor : AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgTint,
    required Color borderColor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 13),
        decoration: BoxDecoration(
          color: bgTint,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: 0.12),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Icon(icon, size: 14, color: color),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: color,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveSessionCard(BuildContext context, ChatModel chat) {
    final customer = chat.customer;
    final lastMessage = chat.messages.isNotEmpty ? chat.messages.last.text : chat.initialMessage;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.emerald.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.emerald.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Ribbon
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: AppColors.emerald.withValues(alpha: 0.08),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.emerald,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'ACTIVE SESSION IN PROGRESS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: AppColors.emerald,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.emerald.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      '#${chat.shortId}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.emerald,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppColors.blue.withValues(alpha: 0.12),
                        child: Text(
                          customer.name.isNotEmpty ? customer.name.substring(0, 1).toUpperCase() : 'C',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.blue,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              customer.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              '${customer.department} • ${customer.email}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Snippet
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.bgInput,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.chat_bubble_outline, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            lastMessage.isNotEmpty ? lastMessage : 'Session open. Waiting for input...',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textPrimary,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.emerald,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.forum_rounded, size: 18),
                      label: const Text(
                        'RESUME CHAT WITH CUSTOMER',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      onPressed: () {
                        context.read<AgentProvider>().resumeChat(chat.id);
                        context.go('/chat/${chat.id}');
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgentProvider>();
    final agent = provider.currentAgent;
    final isAvailable = provider.agentStatus == 'available';

    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.brandPrimary.withValues(alpha: 0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 36,
                  height: 36,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const Icon(
                    Icons.headset_mic_rounded,
                    color: AppColors.brandPrimary,
                    size: 20,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'OmniFlow Support',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                Text(
                  'Agent Console',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Socket Connection status indicator
          Container(
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: provider.isSocketConnected
                  ? const Color(0xFFECFDF5)
                  : const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: provider.isSocketConnected
                    ? const Color(0xFFA7F3D0)
                    : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: provider.isSocketConnected ? AppColors.emerald : AppColors.amber,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: (provider.isSocketConnected ? AppColors.emerald : AppColors.amber)
                            .withValues(alpha: 0.4),
                        blurRadius: 4,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  provider.isSocketConnected ? 'LIVE' : 'SYNCING',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: provider.isSocketConnected ? AppColors.emerald : AppColors.amber,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.blue, size: 22),
            tooltip: 'Ticket History & CSAT',
            onPressed: () => context.push('/history'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.textSecondary, size: 20),
            tooltip: 'Sign Out',
            onPressed: () async {
              await provider.logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            setState(() {});
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Clean & Structured Agent Identity Card
                if (agent != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 12,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Identity Top Row: Avatar + Info + Live Status Badge
                        Row(
                          children: [
                            Stack(
                              children: [
                                CircleAvatar(
                                  radius: 22,
                                  backgroundColor: const Color(0xFFEFF6FF),
                                  backgroundImage: agent.avatar != null && agent.avatar!.isNotEmpty
                                      ? CachedNetworkImageProvider(agent.avatar!)
                                      : null,
                                  child: agent.avatar == null || agent.avatar!.isEmpty
                                      ? Text(
                                          agent.name.isNotEmpty ? agent.name.substring(0, 1).toUpperCase() : 'A',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.blue,
                                          ),
                                        )
                                      : null,
                                ),
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    width: 11,
                                    height: 11,
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(provider.agentStatus),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          agent.name,
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.textPrimary,
                                            letterSpacing: -0.2,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEFF6FF),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: const Color(0xFFBFDBFE)),
                                        ),
                                        child: const Text(
                                          'OPERATOR',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.blue,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${agent.role} • ${agent.department}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            // Current Live Status Pill
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: _getStatusColor(provider.agentStatus).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: _getStatusColor(provider.agentStatus).withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 7,
                                    height: 7,
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(provider.agentStatus),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    _formatStatusLabel(provider.agentStatus),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: _getStatusColor(provider.agentStatus),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // Structured Agent Control Options
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              // 1. Sound Alerts Toggle Button
                              _buildSegmentBtn(
                                label: provider.isSoundMuted ? 'Muted' : 'Sound',
                                icon: provider.isSoundMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                                isActive: true,
                                activeColor: provider.isSoundMuted ? AppColors.rose : AppColors.emerald,
                                activeBg: provider.isSoundMuted ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
                                activeBorder: provider.isSoundMuted ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0),
                                onTap: () => provider.toggleSoundMuted(),
                              ),
                              const SizedBox(width: 4),

                              // 2. Free (Ready) Status
                              _buildSegmentBtn(
                                label: 'Free',
                                dotColor: AppColors.emerald,
                                isActive: provider.agentStatus == 'available',
                                activeColor: AppColors.emerald,
                                activeBg: const Color(0xFFECFDF5),
                                activeBorder: const Color(0xFFA7F3D0),
                                onTap: () => provider.updateStatus('available'),
                              ),
                              const SizedBox(width: 4),

                              // 3. Away Status
                              _buildSegmentBtn(
                                label: 'Away',
                                dotColor: AppColors.amber,
                                isActive: provider.agentStatus == 'busy' || provider.agentStatus == 'away',
                                activeColor: AppColors.amber,
                                activeBg: const Color(0xFFFFFBEB),
                                activeBorder: const Color(0xFFFDE68A),
                                onTap: () => provider.updateStatus('busy'),
                              ),
                              const SizedBox(width: 4),

                              // 4. Break Status
                              _buildSegmentBtn(
                                label: 'Break',
                                dotColor: const Color(0xFF8B5CF6),
                                isActive: provider.agentStatus == 'break',
                                activeColor: const Color(0xFF7C3AED),
                                activeBg: const Color(0xFFF5F3FF),
                                activeBorder: const Color(0xFFDDD6FE),
                                onTap: () => provider.updateStatus('break'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // Metrics Strip
                Row(
                  children: [
                    _buildMetricCard(
                      label: 'Queue Pending',
                      value: provider.metrics['waitingChats']?.toString() ??
                          provider.incomingBroadcasts.length.toString(),
                      icon: Icons.hourglass_top_rounded,
                      color: const Color(0xFFD97706),
                      bgTint: const Color(0xFFFFFBEB),
                      borderColor: const Color(0xFFFDE68A),
                    ),
                    const SizedBox(width: 8),
                    _buildMetricCard(
                      label: 'In Progress',
                      value: provider.metrics['activeChats']?.toString() ?? '0',
                      icon: Icons.chat_bubble_outline_rounded,
                      color: AppColors.blue,
                      bgTint: const Color(0xFFEFF6FF),
                      borderColor: const Color(0xFFBFDBFE),
                    ),
                    const SizedBox(width: 8),
                    _buildMetricCard(
                      label: 'Resolved Today',
                      value: (agent?.resolvedToday ?? 0).toString(),
                      icon: Icons.check_circle_outline_rounded,
                      color: AppColors.emerald,
                      bgTint: const Color(0xFFECFDF5),
                      borderColor: const Color(0xFFA7F3D0),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Active ongoing session banner (if agent backed out to dashboard without resolving)
                if (provider.activeChat != null) ...[
                  _buildActiveSessionCard(context, provider.activeChat!),
                  const SizedBox(height: 20),
                ],

                // Incoming Customer Dispatches (Queue)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(Icons.podcasts_rounded, size: 14, color: AppColors.blue),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'INCOMING DISPATCHES',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    if (provider.incomingBroadcasts.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.rose,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.rose.withValues(alpha: 0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              '${provider.incomingBroadcasts.length} NEW',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),

                if (provider.incomingBroadcasts.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            color: isAvailable
                                ? const Color(0xFFECFDF5)
                                : const Color(0xFFFFFBEB),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isAvailable
                                ? Icons.headset_mic_rounded
                                : Icons.pause_circle_outline_rounded,
                            color: isAvailable ? AppColors.emerald : AppColors.amber,
                            size: 22,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          isAvailable ? 'Queue is Clear' : 'Dispatches Paused',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: isAvailable ? AppColors.textPrimary : AppColors.amber,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isAvailable
                              ? 'Standing by for incoming customer inquiries. Real-time push notifications are armed.'
                              : 'Set status to Free to receive incoming customer inquiries.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: (isAvailable ? AppColors.emerald : AppColors.amber).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: isAvailable ? AppColors.emerald : AppColors.amber,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                isAvailable ? 'LISTENING ON REAL-TIME RADAR' : 'STATUS: AWAY',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                  color: isAvailable ? AppColors.emerald : AppColors.amber,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ...provider.incomingBroadcasts.map((broadcast) {
                    final chatId = broadcast['chatId']?.toString() ?? broadcast['id']?.toString() ?? '';
                    return BroadcastAlertCard(
                      broadcast: broadcast,
                      margin: const EdgeInsets.only(bottom: 12),
                      onAccept: () {
                        provider.acceptChat(chatId);
                        context.go('/chat/$chatId');
                      },
                    );
                  }),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
