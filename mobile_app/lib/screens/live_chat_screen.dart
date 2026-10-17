// lib/screens/live_chat_screen.dart
// ─────────────────────────────────────────────────────────
// Full real-time 1-on-1 agent-to-customer chat screen.
// Supports typing indicators, canned macro quick bar,
// customer dossier sheet, and resolution flow.
// ─────────────────────────────────────────────────────────

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../models/message_model.dart';
import '../providers/agent_provider.dart';
import '../widgets/canned_macro_bar.dart';
import '../widgets/customer_dossier_sheet.dart';
import '../widgets/resolve_modal.dart';
import '../widgets/typing_indicator.dart';

class LiveChatScreen extends StatefulWidget {
  final String chatId;

  const LiveChatScreen({
    super.key,
    required this.chatId,
  });

  @override
  State<LiveChatScreen> createState() => _LiveChatScreenState();
}

class _LiveChatScreenState extends State<LiveChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final DateFormat _timeFormat = DateFormat('hh:mm a');
  Timer? _connectTimeoutTimer;
  bool _hasTimedOut = false;

  @override
  void initState() {
    super.initState();
    _inputController.addListener(_onTextChanged);

    // If activeChat is null or differs from this chatId, attempt to resume it
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<AgentProvider>();
      if (provider.activeChat == null || provider.activeChat!.id != widget.chatId) {
        provider.resumeChat(widget.chatId);
      }
    });

    // Timeout grace period before declaring session unavailable
    _connectTimeoutTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && context.read<AgentProvider>().activeChat == null) {
        setState(() => _hasTimedOut = true);
        Future.delayed(const Duration(milliseconds: 600), () {
          if (mounted) context.go('/dashboard');
        });
      }
    });
  }

  @override
  void dispose() {
    _connectTimeoutTimer?.cancel();
    _inputController.removeListener(_onTextChanged);
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    final isTyping = _inputController.text.trim().isNotEmpty;
    context.read<AgentProvider>().sendTyping(isTyping);
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage([String? textOverride]) {
    final text = textOverride ?? _inputController.text.trim();
    if (text.isEmpty) return;

    final provider = context.read<AgentProvider>();
    provider.sendMessage(text);

    if (textOverride == null) {
      _inputController.clear();
    }

    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  Widget _buildMessageBubble(MessageModel message) {
    final isAgent = message.isAgent;
    final isSystem = message.isSystem;

    if (isSystem) {
      if (message.text.trim().isEmpty) return const SizedBox.shrink();
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.bgInput,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Text(
            message.text,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isAgent ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isAgent) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.blue.withValues(alpha: 0.1),
              child: const Icon(Icons.person, size: 16, color: AppColors.blue),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isAgent ? AppColors.agentBubble : AppColors.customerBubble,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isAgent ? 16 : 4),
                  bottomRight: Radius.circular(isAgent ? 4 : 16),
                ),
                border: isAgent ? null : Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment:
                    isAgent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (!isAgent)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: Text(
                        message.senderName.isNotEmpty
                            ? message.senderName
                            : 'Customer',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.blue,
                        ),
                      ),
                    ),
                  Text(
                    message.text,
                    style: TextStyle(
                      fontSize: 14,
                      color: isAgent ? Colors.white : AppColors.textPrimary,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _timeFormat.format(message.timestamp),
                    style: TextStyle(
                      fontSize: 10,
                      color: isAgent
                          ? Colors.white.withValues(alpha: 0.7)
                          : AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isAgent) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.emerald.withValues(alpha: 0.2),
              child: const Icon(Icons.support_agent, size: 16, color: AppColors.emerald),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgentProvider>();
    final chat = provider.activeChat;

    // If chat is loading / connecting, display a smooth connection screen instead of instantly kicking to dashboard
    if (chat == null) {
      return Scaffold(
        backgroundColor: AppColors.bgPrimary,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            tooltip: 'Back to Dashboard',
            onPressed: () => context.go('/dashboard'),
          ),
          title: const Text(
            'Connecting to Session...',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_hasTimedOut) ...[
                const Icon(Icons.error_outline, size: 40, color: AppColors.rose),
                const SizedBox(height: 12),
                const Text(
                  'Session could not be loaded or was resolved.',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 8),
                const Text('Returning to dashboard...', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ] else ...[
                const CircularProgressIndicator(color: AppColors.emerald),
                const SizedBox(height: 16),
                const Text(
                  'Joining active session...',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ],
            ],
          ),
        ),
      );
    }

    final customer = chat.customer;

    // Trigger auto scroll when new messages arrive
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToBottom();
    });

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        context.go('/dashboard');
      },
      child: Scaffold(
        backgroundColor: AppColors.bgPrimary,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            tooltip: 'Back to Dashboard',
            onPressed: () => context.go('/dashboard'),
          ),
          titleSpacing: 0,
          title: InkWell(
          onTap: () => CustomerDossierSheet.show(context, chat),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.blue.withValues(alpha: 0.1),
                child: Text(
                  customer.name.isNotEmpty ? customer.name.substring(0, 1) : 'C',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.blue,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      customer.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '${customer.department} • #${chat.shortId}',
                      style: const TextStyle(
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
        actions: [
          // Customer Profile Dossier button
          IconButton(
            icon: const Icon(Icons.info_outline, color: AppColors.textSecondary),
            tooltip: 'Customer Dossier & Notes',
            onPressed: () => CustomerDossierSheet.show(context, chat),
          ),

          // Resolve & Close button
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ElevatedButton.icon(
              onPressed: () {
                ResolveModal.show(
                  context,
                  onConfirm: (summary) {
                    provider.resolveChat(summary);
                    context.go('/dashboard');
                  },
                );
              },
              icon: const Icon(Icons.check, size: 16),
              label: const Text('Resolve', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.rose,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Subject Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: AppColors.border),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.help_outline, size: 16, color: AppColors.blue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      chat.subject,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // Message Stream
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: provider.messages.length,
                itemBuilder: (context, index) {
                  return _buildMessageBubble(provider.messages[index]);
                },
              ),
            ),

            // Typing Indicator
            if (provider.isCustomerTyping)
              TypingIndicator(userName: customer.name),

            // Canned Macro Bar
            CannedMacroBar(
              onSelectMacro: (macroText) => _sendMessage(macroText),
            ),

            // Bottom Message Input Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.bgInput,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: TextField(
                        controller: _inputController,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendMessage(),
                        maxLines: null,
                        style: const TextStyle(fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Type response to customer...',
                          hintStyle: TextStyle(fontSize: 13, color: AppColors.textMuted),
                          border: InputBorder.none,
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ValueListenableBuilder<TextEditingValue>(
                    valueListenable: _inputController,
                    builder: (context, val, _) {
                      final hasText = val.text.trim().isNotEmpty;
                      return IconButton(
                        icon: const Icon(Icons.send_rounded),
                        color: hasText ? AppColors.blue : AppColors.textMuted,
                        onPressed: hasText ? () => _sendMessage() : null,
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
}
