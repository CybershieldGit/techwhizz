// lib/screens/ticket_history_screen.dart
// ─────────────────────────────────────────────────────────
// Past resolved tickets history & CSAT star rating review.
// Provides search, rating filters, and full transcript modal.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../models/chat_model.dart';
import '../models/message_model.dart';
import '../providers/agent_provider.dart';

class TicketHistoryScreen extends StatefulWidget {
  const TicketHistoryScreen({super.key});

  @override
  State<TicketHistoryScreen> createState() => _TicketHistoryScreenState();
}

class _TicketHistoryScreenState extends State<TicketHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  int? _selectedRatingFilter; // null = all, 5, 4, 3, etc.
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AgentProvider>().fetchHistory();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ChatModel> _filterChats(List<ChatModel> rawList) {
    return rawList.where((chat) {
      if (_selectedRatingFilter != null && chat.rating != _selectedRatingFilter) {
        return false;
      }
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final nameMatch = chat.customer.name.toLowerCase().contains(query);
        final emailMatch = chat.customer.email.toLowerCase().contains(query);
        final subjectMatch = chat.subject.toLowerCase().contains(query);
        final idMatch = chat.id.toLowerCase().contains(query);
        final summaryMatch = (chat.summary ?? '').toLowerCase().contains(query);
        if (!nameMatch && !emailMatch && !subjectMatch && !idMatch && !summaryMatch) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  void _showTicketDetails(BuildContext context, ChatModel chat) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _TicketDetailsSheet(chat: chat),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgentProvider>();
    final allChats = provider.resolvedHistory;
    final filteredChats = _filterChats(allChats);

    // Calculate rating statistics
    final ratedChats = allChats.where((c) => c.rating != null && c.rating! > 0).toList();
    final double avgRating = ratedChats.isNotEmpty
        ? (ratedChats.fold<int>(0, (sum, c) => sum + c.rating!) / ratedChats.length)
        : 0.0;
    final int fiveStarCount = allChats.where((c) => c.rating == 5).length;

    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      appBar: AppBar(
        title: const Text(
          'Resolved Tickets & CSAT',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.textSecondary),
            tooltip: 'Refresh Tickets',
            onPressed: () => provider.fetchHistory(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.fetchHistory(),
        child: Column(
          children: [
            // CSAT Performance Header Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: AppColors.border),
                ),
              ),
              child: Row(
                children: [
                  // CSAT Score Box
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 20),
                            const SizedBox(width: 4),
                            Text(
                              avgRating > 0 ? avgRating.toStringAsFixed(1) : '—',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFB45309),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Average CSAT',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Total & 5-Star Stats
                  Expanded(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${allChats.length}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const Text(
                                'Total Resolved',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$fiveStarCount',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.emerald,
                                ),
                              ),
                              const Text(
                                '5-Star Reviews',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Search Bar & Filter Chips
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: Colors.white,
              child: Column(
                children: [
                  Container(
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.bgInput,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Search customer, issue, or ticket #...',
                        hintStyle: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textSecondary),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 16),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val.trim()),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Rating Filters
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip(label: 'All Ratings', rating: null),
                        const SizedBox(width: 6),
                        _buildFilterChip(label: '5 ⭐', rating: 5),
                        const SizedBox(width: 6),
                        _buildFilterChip(label: '4 ⭐', rating: 4),
                        const SizedBox(width: 6),
                        _buildFilterChip(label: '3 ⭐', rating: 3),
                        const SizedBox(width: 6),
                        _buildFilterChip(label: '1–2 ⭐', rating: 1),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Tickets List
            Expanded(
              child: provider.isLoadingHistory && allChats.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : filteredChats.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.assignment_turned_in_outlined,
                                size: 56,
                                color: AppColors.textMuted.withValues(alpha: 0.5),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'No Resolved Tickets Found',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Resolved customer sessions will show up here.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredChats.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final chat = filteredChats[index];
                            return _buildTicketCard(context, chat);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip({required String label, required int? rating}) {
    final isSelected = _selectedRatingFilter == rating;
    return InkWell(
      onTap: () => setState(() => _selectedRatingFilter = rating),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.blue : AppColors.bgInput,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.blue : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildTicketCard(BuildContext context, ChatModel chat) {
    final dateStr = chat.resolvedAt != null
        ? DateFormat('MMM d, h:mm a').format(chat.resolvedAt!.toLocal())
        : DateFormat('MMM d, h:mm a').format(chat.createdAt.toLocal());

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showTicketDetails(context, chat),
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Customer Avatar, Name, ShortId, Rating
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: AppColors.blue.withValues(alpha: 0.1),
                      child: Text(
                        chat.customer.name.isNotEmpty
                            ? chat.customer.name.substring(0, 1).toUpperCase()
                            : 'C',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.blue,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                chat.customer.name,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.bgInput,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '#${chat.shortId}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${chat.customer.department} • $dateStr',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Rating Star Badge
                    if (chat.rating != null && chat.rating! > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFCD34D)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 14),
                            const SizedBox(width: 3),
                            Text(
                              '${chat.rating}.0',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF92400E),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.bgInput,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Unrated',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 10),

                // Subject / Issue Inquiry
                Text(
                  chat.subject,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                if (chat.summary != null && chat.summary!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.emerald.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.emerald.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 13, color: AppColors.emerald),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            chat.summary!,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 10),

                // Bottom pill tags: Transcript length & Notes count
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.bgInput,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.chat_bubble_outline_rounded, size: 12, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            '${chat.messages.length} msgs',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (chat.notes.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.edit_note_rounded, size: 12, color: AppColors.blue),
                            const SizedBox(width: 4),
                            Text(
                              '${chat.notes.length} notes',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.blue,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const Spacer(),
                    const Text(
                      'View Details →',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.blue,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────
// Ticket Details & Read-Only Transcript Sheet
// ─────────────────────────────────────────────────────────
class _TicketDetailsSheet extends StatelessWidget {
  final ChatModel chat;

  const _TicketDetailsSheet({required this.chat});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ticket #${chat.shortId}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '${chat.customer.name} • ${chat.customer.department}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Tab / Content View
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // CSAT & Customer Overview
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.bgInput,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Customer Rating',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          if (chat.rating != null && chat.rating! > 0)
                            Row(
                              children: List.generate(5, (starIdx) {
                                return Icon(
                                  Icons.star_rounded,
                                  size: 18,
                                  color: starIdx < chat.rating!
                                      ? const Color(0xFFF59E0B)
                                      : Colors.grey.shade300,
                                );
                              }),
                            )
                          else
                            const Text(
                              'No CSAT submitted',
                              style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Divider(height: 1),
                      const SizedBox(height: 10),
                      Text(
                        'Email: ${chat.customer.email}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                      ),
                      if (chat.customer.tier != null && chat.customer.tier!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Tier: ${chat.customer.tier!.toUpperCase()}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                        ),
                      ],
                      if (chat.customer.ip != null && chat.customer.ip!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'IP Address: ${chat.customer.ip!}',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ],
                  ),
                ),

                // Resolution Summary
                if (chat.summary != null && chat.summary!.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  const Text(
                    'Resolution Summary',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.emerald.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.emerald.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      chat.summary!,
                      style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.4),
                    ),
                  ),
                ],

                // Internal Case Notes
                if (chat.notes.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(
                    'Internal Notes (${chat.notes.length})',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  ...chat.notes.map((note) {
                    final author = note['author'] ?? note['agentName'] ?? 'Agent';
                    final text = note['text'] ?? note['note'] ?? '';
                    final ts = note['timestamp']?.toString() ?? '';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEFCE8),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFEF08A)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                author,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF854D0E),
                                ),
                              ),
                              if (ts.isNotEmpty)
                                Text(
                                  ts.length > 16 ? ts.substring(0, 16) : ts,
                                  style: const TextStyle(fontSize: 9, color: Color(0xFFA16207)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            text,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF713F12)),
                          ),
                        ],
                      ),
                    );
                  }),
                ],

                // Full Read-Only Chat Transcript
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Session Transcript',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '${chat.messages.length} messages',
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (chat.messages.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    alignment: Alignment.center,
                    child: const Text(
                      'No transcript records saved for this session.',
                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  )
                else
                  ...chat.messages.map((msg) => _buildTranscriptBubble(msg)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTranscriptBubble(MessageModel message) {
    final isAgent = message.isAgent;
    final isSystem = message.isSystem;

    if (isSystem) {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        alignment: Alignment.center,
        child: Text(
          message.text,
          style: const TextStyle(
            fontSize: 10,
            fontStyle: FontStyle.italic,
            color: AppColors.textMuted,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Align(
        alignment: isAgent ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 280),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isAgent ? AppColors.blue : AppColors.bgInput,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(14),
              topRight: const Radius.circular(14),
              bottomLeft: isAgent ? const Radius.circular(14) : Radius.zero,
              bottomRight: isAgent ? Radius.zero : const Radius.circular(14),
            ),
            border: Border.all(
              color: isAgent ? AppColors.blue : AppColors.border,
            ),
          ),
          child: Column(
            crossAxisAlignment: isAgent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              Text(
                message.senderName,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: isAgent ? Colors.white70 : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                message.text,
                style: TextStyle(
                  fontSize: 12,
                  color: isAgent ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
