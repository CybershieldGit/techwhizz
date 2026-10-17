// lib/providers/agent_provider.dart
// ─────────────────────────────────────────────────────────
// Central state management for the OmniFlow BPO Agent app.
// Manages authentication, socket events, active chat, queue,
// and roster state.
// ─────────────────────────────────────────────────────────

import 'dart:async';
import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/agent_model.dart';
import '../models/chat_model.dart';
import '../models/message_model.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';
import '../services/fcm_service.dart';

class AgentProvider extends ChangeNotifier {
  AgentModel? _currentAgent;
  String _agentStatus = 'available';
  bool _isLoading = false;
  String? _errorMessage;
  Completer<bool>? _acceptCompleter;

  // Active chat & messages
  ChatModel? _activeChat;
  final List<MessageModel> _messages = [];
  bool _isCustomerTyping = false;
  Timer? _typingDebounceTimer;

  // Real-time broadcasts (pending incoming chats to claim)
  final List<Map<String, dynamic>> _incomingBroadcasts = [];

  // Team roster & fleet metrics
  List<AgentModel> _rosterAgents = [];
  Map<String, dynamic> _metrics = {
    'waitingChats': 0,
    'activeChats': 0,
    'resolvedToday': 0,
    'onlineAgents': 0,
  };

  // Socket connection state
  bool _isSocketConnected = false;

  // ── Getters ───────────────────────────────────────────────
  AgentModel? get currentAgent => _currentAgent;
  bool get isLoggedIn => _currentAgent != null;
  String get agentStatus => _agentStatus;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  ChatModel? get activeChat => _activeChat;
  List<MessageModel> get messages => List.unmodifiable(_messages);
  bool get isCustomerTyping => _isCustomerTyping;

  List<Map<String, dynamic>> get incomingBroadcasts =>
      List.unmodifiable(_incomingBroadcasts);
  List<AgentModel> get rosterAgents => List.unmodifiable(_rosterAgents);
  Map<String, dynamic> get metrics => _metrics;
  bool get isSocketConnected => _isSocketConnected;

  // ── Initialization / Session Check ────────────────────────
  Future<bool> checkExistingSession() async {
    _isLoading = true;
    notifyListeners();

    final savedAgent = await AuthService.loadSavedSession();
    if (savedAgent != null) {
      _currentAgent = savedAgent;
      _agentStatus = savedAgent.status.isNotEmpty ? savedAgent.status : 'available';
      _isLoading = false;
      _connectAndRegisterSocket();
      notifyListeners();
      return true;
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ── Authentication ────────────────────────────────────────
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await AuthService.login(email: email, password: password);
    _isLoading = false;

    if (result.success && result.agent != null) {
      _currentAgent = result.agent;
      _agentStatus = _currentAgent!.status.isNotEmpty ? _currentAgent!.status : 'available';
      _connectAndRegisterSocket();
      notifyListeners();
      return true;
    } else {
      _errorMessage = result.error ?? 'Login failed. Please check credentials.';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    if (_currentAgent != null) {
      SocketService.updateStatus(_currentAgent!.id, 'offline');
    }
    SocketService.disconnect();
    await AuthService.logout();
    _currentAgent = null;
    _activeChat = null;
    _messages.clear();
    _incomingBroadcasts.clear();
    _rosterAgents.clear();
    _isSocketConnected = false;
    notifyListeners();
  }

  // ── Socket Connection & Handlers ──────────────────────────
  void _connectAndRegisterSocket() {
    final s = SocketService.connect();

    void register() {
      _isSocketConnected = true;
      notifyListeners();
      if (_currentAgent != null) {
        SocketService.registerAgent(_currentAgent!.id, status: _agentStatus);
        _registerFcmWithServer();
      }
    }

    if (s.connected) {
      register();
    }

    SocketService.on('connect', (_) => register());

    SocketService.on('disconnect', (_) {
      _isSocketConnected = false;
      notifyListeners();
    });

    // Remove any previous custom listeners to avoid duplication
    SocketService.off(AppConstants.evtAgentRegistered);
    SocketService.off(AppConstants.evtIncomingBroadcast);
    SocketService.off(AppConstants.evtChatClaimedByOther);
    SocketService.off(AppConstants.evtChatAcceptSuccess);
    SocketService.off(AppConstants.evtChatAcceptFailed);
    SocketService.off(AppConstants.evtNewMessage);
    SocketService.off(AppConstants.evtUserTyping);
    SocketService.off(AppConstants.evtChatEnded);
    SocketService.off(AppConstants.evtNotesUpdated);
    SocketService.off(AppConstants.evtAgentsUpdate);
    SocketService.off(AppConstants.evtMetricsUpdate);
    SocketService.off(AppConstants.evtSessionTerminated);

    // 1. Agent Registered confirmation
    SocketService.on(AppConstants.evtAgentRegistered, (data) {
      if (data is Map) {
        final agentMap = Map<String, dynamic>.from(data);
        if (agentMap['agent'] != null) {
          _currentAgent = AgentModel.fromJson(Map<String, dynamic>.from(agentMap['agent']));
        }
        notifyListeners();
      }
    });

    // 2. Incoming Chat Broadcast (Queue Ticket Alert)
    SocketService.on(AppConstants.evtIncomingBroadcast, (data) {
      if (data is Map) {
        final broadcast = Map<String, dynamic>.from(data);
        final chatId = broadcast['chatId']?.toString() ?? broadcast['id']?.toString();
        debugPrint('> [Flutter Provider] Received incoming broadcast ticket: $chatId');
        if (chatId != null && chatId.isNotEmpty) {
          broadcast['chatId'] = chatId;
          broadcast['id'] = chatId;
          final exists = _incomingBroadcasts.any((b) =>
              b['chatId']?.toString() == chatId || b['id']?.toString() == chatId);
          if (!exists) {
            _incomingBroadcasts.insert(0, broadcast);
            notifyListeners();
          }
        }
      }
    });

    // 3. Ticket Claimed by another agent
    SocketService.on(AppConstants.evtChatClaimedByOther, (data) {
      if (data is Map) {
        final claimedChatId = data['chatId']?.toString() ?? data['id']?.toString();
        _incomingBroadcasts.removeWhere((b) =>
            b['chatId']?.toString() == claimedChatId || b['id']?.toString() == claimedChatId);
        notifyListeners();
      }
    });

    // 4. Chat Claim Accepted successfully by this agent
    SocketService.on(AppConstants.evtChatAcceptSuccess, (data) {
      if (data is Map) {
        final mapData = Map<String, dynamic>.from(data);
        final chatJson = mapData['chat'] != null
            ? Map<String, dynamic>.from(mapData['chat'])
            : mapData;

        _activeChat = ChatModel.fromJson(chatJson);
        _messages.clear();
        _messages.addAll(_activeChat!.messages);
        _agentStatus = 'in_chat';

        // Remove from pending broadcasts
        _incomingBroadcasts.removeWhere((b) => b['chatId']?.toString() == _activeChat!.id);
        if (_acceptCompleter != null && !_acceptCompleter!.isCompleted) {
          _acceptCompleter!.complete(true);
        }
        notifyListeners();
      }
    });

    // 5. Chat Claim Failed (Race condition: another agent claimed first)
    SocketService.on(AppConstants.evtChatAcceptFailed, (data) {
      if (data is Map) {
        final mapData = Map<String, dynamic>.from(data);
        final failedChatId = mapData['chatId']?.toString();
        _incomingBroadcasts.removeWhere((b) => b['chatId']?.toString() == failedChatId);
        _errorMessage = mapData['message'] ?? 'Chat was claimed by another agent.';
        if (_acceptCompleter != null && !_acceptCompleter!.isCompleted) {
          _acceptCompleter!.complete(false);
        }
        notifyListeners();
      }
    });

    // 6. New Message received
    SocketService.on(AppConstants.evtNewMessage, (data) {
      if (data is Map) {
        final rawMap = Map<String, dynamic>.from(data);
        final chatId = rawMap['chatId']?.toString() ?? rawMap['id']?.toString();
        final msgData = rawMap['message'] is Map
            ? Map<String, dynamic>.from(rawMap['message'])
            : rawMap;

        final message = MessageModel.fromJson(msgData);
        debugPrint('> [Flutter Provider] New message received: [${message.sender}] ${message.text}');

        // Only append if it's for the currently active chat
        if (_activeChat != null &&
            (chatId == null ||
             chatId == _activeChat!.id ||
             msgData['chatId']?.toString() == _activeChat!.id)) {
          _messages.add(message);
          _isCustomerTyping = false; // Customer sent message, typing ended
          notifyListeners();
        }
      }
    });

    // 7. Typing Indicator event
    SocketService.on(AppConstants.evtUserTyping, (data) {
      if (data is Map) {
        final mapData = Map<String, dynamic>.from(data);
        final sender = mapData['sender']?.toString();
        final isTyping = mapData['isTyping'] == true;

        if (sender == 'customer') {
          _isCustomerTyping = isTyping;
          notifyListeners();
        }
      }
    });

    // 8. Chat Ended / Resolved
    SocketService.on(AppConstants.evtChatEnded, (data) {
      _activeChat = null;
      _messages.clear();
      _isCustomerTyping = false;
      _agentStatus = 'available';
      notifyListeners();
    });

    // 9. Notes updated
    SocketService.on(AppConstants.evtNotesUpdated, (data) {
      if (data is Map && _activeChat != null) {
        final mapData = Map<String, dynamic>.from(data);
        final updatedNotes = (mapData['notes'] as List<dynamic>? ?? [])
            .map((n) => Map<String, dynamic>.from(n))
            .toList();
        _activeChat = ChatModel(
          id: _activeChat!.id,
          customer: _activeChat!.customer,
          subject: _activeChat!.subject,
          initialMessage: _activeChat!.initialMessage,
          status: _activeChat!.status,
          assignedAgent: _activeChat!.assignedAgent,
          messages: _messages,
          notes: updatedNotes,
          summary: _activeChat!.summary,
          rating: _activeChat!.rating,
          createdAt: _activeChat!.createdAt,
          acceptedAt: _activeChat!.acceptedAt,
          resolvedAt: _activeChat!.resolvedAt,
        );
        notifyListeners();
      }
    });

    // 10. Roster update (all agents on shift)
    SocketService.on(AppConstants.evtAgentsUpdate, (data) {
      if (data is List) {
        _rosterAgents = data
            .map((item) => AgentModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
        notifyListeners();
      }
    });

    // 11. Metrics update
    SocketService.on(AppConstants.evtMetricsUpdate, (data) {
      if (data is Map) {
        _metrics = Map<String, dynamic>.from(data);
        notifyListeners();
      }
    });

    // 12. Session terminated by admin
    SocketService.on(AppConstants.evtSessionTerminated, (data) {
      logout();
    });
  }

  // ── FCM Token Registration Helper ────────────────────────
  Future<void> _registerFcmWithServer() async {
    try {
      final token = await FcmService.getToken();
      if (token != null && _currentAgent != null) {
        SocketService.registerFcmToken(_currentAgent!.id, token);
      }
    } catch (_) {
      // FCM might not be available during local desktop/offline run
    }
  }

  // ── Actions ───────────────────────────────────────────────
  void updateStatus(String status) {
    if (_currentAgent == null) return;
    _agentStatus = status;
    SocketService.updateStatus(_currentAgent!.id, status);
    notifyListeners();
  }

  Future<bool> acceptChat(String chatId) async {
    if (_currentAgent == null) return false;
    _acceptCompleter = Completer<bool>();
    SocketService.acceptChat(_currentAgent!.id, chatId);
    try {
      return await _acceptCompleter!.future.timeout(
        const Duration(seconds: 5),
        onTimeout: () => false,
      );
    } catch (_) {
      return false;
    }
  }

  void resumeChat([String? targetChatId]) {
    final chatId = targetChatId ?? _activeChat?.id ?? _currentAgent?.activeChatId;
    if (_currentAgent == null || chatId == null) return;
    SocketService.resumeChat(_currentAgent!.id, chatId);
  }

  void sendMessage(String text) {
    if (_activeChat == null || _currentAgent == null || text.trim().isEmpty) return;

    SocketService.sendMessage(
      chatId: _activeChat!.id,
      senderName: _currentAgent!.name,
      text: text.trim(),
    );
  }

  void sendTyping(bool isTyping) {
    if (_activeChat == null) return;
    _typingDebounceTimer?.cancel();

    SocketService.sendTyping(
      chatId: _activeChat!.id,
      isTyping: isTyping,
    );

    if (isTyping) {
      _typingDebounceTimer = Timer(const Duration(milliseconds: 2000), () {
        SocketService.sendTyping(
          chatId: _activeChat!.id,
          isTyping: false,
        );
      });
    }
  }

  void addNote(String note) {
    if (_activeChat == null || _currentAgent == null || note.trim().isEmpty) return;

    SocketService.addNote(
      chatId: _activeChat!.id,
      agentName: _currentAgent!.name,
      note: note.trim(),
    );
  }

  void resolveChat(String summary) {
    if (_activeChat == null || _currentAgent == null) return;

    SocketService.endChat(
      chatId: _activeChat!.id,
      resolvedBy: _currentAgent!.name,
      summary: summary.trim(),
    );

    _activeChat = null;
    _messages.clear();
    _agentStatus = 'available';
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
